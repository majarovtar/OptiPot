import csv
import os
from typing import Dict, List


class RouteController:
    @staticmethod
    def get_routes_geojson() -> Dict:
        """
        Read `data/routes_solution.csv` and return a GeoJSON FeatureCollection
        where each feature is a LineString for a vehicle's route. Assumes
        CSV has header: vehicle_id,vehicle_index,stop_index,order_id,demand_kg,cumulative_load_kg,lat,lon
        """
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_root = os.path.dirname(backend_dir)
        csv_path = os.path.join(project_root, "data", "routes_solution.csv")

        vehicles: Dict[str, List[List[float]]] = {}

        try:
            with open(csv_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    vid = row.get("vehicle_id")
                    lat = row.get("lat")
                    lon = row.get("lon")
                    if not vid or lat is None or lon is None:
                        continue
                    try:
                        lat_f = float(lat)
                        lon_f = float(lon)
                    except ValueError:
                        continue

                    if vid not in vehicles:
                        vehicles[vid] = []
                    # GeoJSON expects [lon, lat]
                    vehicles[vid].append([lon_f, lat_f])
        except FileNotFoundError:
            print(f"routes_solution.csv not found at {csv_path}")
        except Exception as e:
            print(f"Error reading routes CSV: {e}")

        features = []
        for vid, coords in vehicles.items():
            if not coords:
                continue
            feature = {
                "type": "Feature",
                "properties": {"vehicle_id": vid},
                "geometry": {"type": "LineString", "coordinates": coords},
            }
            features.append(feature)

        return {"type": "FeatureCollection", "features": features}
