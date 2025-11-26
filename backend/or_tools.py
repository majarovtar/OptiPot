from math import radians, sin, cos, sqrt, atan2
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
import pandas as pd
import csv
from copy import deepcopy
import numpy as np

def haversine_km(lat1, lon1, lat2, lon2):
    # approximate radius of earth in km
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def build_time_matrix(orders_df, speed_kmh=30):
    n = len(orders_df)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                matrix[i][j] = 0
            else:
                d_km = haversine_km(
                    orders_df.loc[i, "lat"],
                    orders_df.loc[i, "lon"],
                    orders_df.loc[j, "lat"],
                    orders_df.loc[j, "lon"],
                )
                # convert distance to minutes with a simple fixed speed
                time_hours = d_km / speed_kmh
                matrix[i][j] = int(time_hours * 60)  # minutes as integer
    return matrix


def solve_routes(orders_df, vehicles_df, config=None):
    """Solve vehicle routing with capacities, time windows and flexible costs.

    orders_df: DataFrame containing orders. Expected columns: OrderID, Weight(kg),
        Priority, WindowStart, WindowEnd, lat, lon (and optional address fields).
    vehicles_df: DataFrame with vehicle info. Expected columns: vehicle_id,
        max_capacity_kg, emission_g_co2_per_km
    config: dict with optional keys:
        - allow_late_deliveries (bool)
        - w_distance (float)
        - w_emissions (float)
        - w_on_time (float)
        - speed_kmh (float)
        - time_limit_sec (int)
        - output_path (str) -> write CSV when provided
    Returns: dict with solution rows under 'routes' and 'status' message.
    """

    # Defensive copy
    orders = deepcopy(orders_df).reset_index(drop=True)
    vehicles = deepcopy(vehicles_df).reset_index(drop=True)

    # Default config
    cfg = {
        "allow_late_deliveries": True,
        "w_distance": 1.0,
        "w_emissions": 1.0,
        "w_on_time": 1.0,
        "speed_kmh": 30,
        "time_limit_sec": 10,
        "output_path": None,
    }
    if config:
        cfg.update(config)

    # Insert depot as first row if not present
    if not ((orders.get("OrderID") == "depot").any()):
        depot_row = {
            "OrderID": "depot",
            "Weight(kg)": 0,
            "Priority": 0,
            "WindowStart": "",
            "WindowEnd": "",
            "street": "",
            "house_number": "",
            "postal_code": "",
            "city": "",
            "full_address": "Depot",
            "lat": 46.0506713158607,
            "lon": 14.459560361232214,
        }
        orders = pd.concat([pd.DataFrame([depot_row]), orders], ignore_index=True)

    # Data containers
    data = {}

    # Build time matrix (in minutes)
    data["time_matrix"] = build_time_matrix(orders, speed_kmh=cfg["speed_kmh"])
    #data["time_matrix"] = np.load("../data/dur_matrix.npy").tolist()

    # Nodes & depot
    data["num_vehicles"] = len(vehicles)
    data["depot"] = 0

    # Scaling to keep integers for capacities
    SCALE = 100
    data["demands"] = []
    for i, row in orders.iterrows():
        if i == data["depot"]:
            data["demands"].append(0)
        else:
            w = row.get("Weight(kg)", 0)
            data["demands"].append(int(round(w * SCALE)))

    raw_caps = vehicles["max_capacity_kg"].tolist()
    data["vehicle_capacities"] = [int(round(c * SCALE)) for c in raw_caps]

    # Build routing model
    manager = pywrapcp.RoutingIndexManager(
        len(data["time_matrix"]), data["num_vehicles"], data["depot"]
    )
    routing = pywrapcp.RoutingModel(manager)

    # Transit callback (time)
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        # data["time_matrix"] is a numpy ndarray, index with [i, j]
        return int(data["time_matrix"][from_node, to_node])

    transit_cb_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb_index)

    # Cost: per-vehicle cost callbacks combining distance and emissions
    # distance_km_matrix = [[
    #     haversine_km(
    #         orders.loc[i, "lat"], orders.loc[i, "lon"],
    #         orders.loc[j, "lat"], orders.loc[j, "lon"]
    #     )
    #     for j in range(len(orders))
    # ] for i in range(len(orders))]

    distance_km_matrix = np.load("../data/dist_matrix.npy")

    #distance_km_matrix = np.load("../data/dist_matrix.npy").tolist()

    w_distance = cfg["w_distance"]
    w_emissions = cfg["w_emissions"]
    SCALE_COST = 100
    vehicle_emissions = list(vehicles["emission_g_co2_per_km"])

    def make_cost_callback_for_vehicle(v):
        def cost_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)

            distance_km = distance_km_matrix[from_node][to_node]
            emission_factor = vehicle_emissions[v]

            base_distance_cost = w_distance * distance_km
            emission_cost = w_emissions * distance_km * emission_factor

            total = base_distance_cost + emission_cost
            return int(round(total * SCALE_COST))
        return cost_callback

    for v in range(data["num_vehicles"]):
        cb_index = routing.RegisterTransitCallback(make_cost_callback_for_vehicle(v))
        routing.SetArcCostEvaluatorOfVehicle(cb_index, v)

    # Capacity dimension
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data["demands"][from_node]

    demand_cb_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_cb_index,
        0,
        data["vehicle_capacities"],
        True,
        "Capacity",
    )

    # Time dimension
    routing.AddDimension(
        transit_cb_index,
        30,  # max waiting slack
        24 * 60,  # max route duration
        False,
        "Time",
    )
    time_dimension = routing.GetDimensionOrDie("Time")

    # Time-window helpers
    def to_minutes(t):
        if pd.isna(t) or t == "":
            return None
        parts = str(t).split(":")
        try:
            h, m = map(int, parts[:2])
        except Exception:
            return None
        return h * 60 + m

    LATE_PENALTY_PER_MIN = int(cfg["w_on_time"])

    for node_index, row in orders.iterrows():
        if node_index == data["depot"]:
            continue
        index = manager.NodeToIndex(node_index)
        start = to_minutes(row.get("WindowStart", ""))
        end = to_minutes(row.get("WindowEnd", ""))
        if start is None or end is None:
            continue
        time_dimension.CumulVar(index).SetRange(start, end)
        if cfg.get("allow_late_deliveries"):
            time_dimension.SetCumulVarSoftUpperBound(index, end, LATE_PENALTY_PER_MIN)

    # Priority/disjunctions
    for node_index, row in orders.iterrows():
        if node_index == data["depot"]:
            continue
        index = manager.NodeToIndex(node_index)
        priority = str(row.get("Priority", "")).strip().lower()
        priority_penalties = {
            "urgent": 200000,
            "express": 100000,
            "standard": 10000,
        }
        penalty = priority_penalties.get(priority, 10000)
        routing.AddDisjunction([index], penalty)

    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.FromSeconds(int(cfg.get("time_limit_sec", 10)))

    solution = routing.SolveWithParameters(search_params)

    routes_rows = []
    if solution:
        for v in range(data["num_vehicles"]):
            veh_row = vehicles.iloc[v]
            veh_id = veh_row["vehicle_id"]
            veh_cap_kg = veh_row["max_capacity_kg"]

            index = routing.Start(v)
            route_load = 0
            stop_idx = 0
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                order_id = orders.loc[node_index, "OrderID"]
                demand_units = data["demands"][node_index]
                route_load += demand_units
                load_kg = route_load / SCALE
                demand_kg = demand_units / SCALE

                routes_rows.append({
                    "vehicle_id": veh_id,
                    "vehicle_index": v,
                    "stop_index": stop_idx,
                    "order_id": order_id,
                    "demand_kg": f"{demand_kg:.2f}",
                    "cumulative_load_kg": f"{load_kg:.2f}",
                    "lat": orders.loc[node_index, "lat"],
                    "lon": orders.loc[node_index, "lon"],
                })

                index = solution.Value(routing.NextVar(index))
                stop_idx += 1
    print(routes_rows)

    result = {"status": "OK" if solution else "NO_SOLUTION", "routes": routes_rows}

    output_path = cfg.get("output_path")
    if output_path and routes_rows:
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "vehicle_id",
                    "vehicle_index",
                    "stop_index",
                    "order_id",
                    "demand_kg",
                    "cumulative_load_kg",
                    "lat",
                    "lon",
                ],
            )
            writer.writeheader()
            writer.writerows(routes_rows)
        result["output_path"] = output_path

    return result


if __name__ == "__main__":
    # Script-style runner for quick testing
    orders = pd.read_csv("../data/orders_with_coords.csv")
    vehicles = pd.read_csv("../data/delivery_vehicles.csv")
    cfg = {"output_path": "../data/routes_solution.csv", "time_limit_sec": 10}
    sol = solve_routes(orders, vehicles, cfg)
    print(sol.get("status"))
    if sol.get("output_path"):
        print(f"Solution saved to {sol['output_path']}")
