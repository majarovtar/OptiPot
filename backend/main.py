from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes.user_routes import router as user_router
from routes.order_routes import router as order_router
from routes.vehicle_routes import router as vehicle_router
from routes.route_routes import router as route_router
from pydantic import BaseModel
import or_tools
import pandas as pd

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:5174"],  # Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def start_db():
    await init_db()

app.include_router(user_router)
app.include_router(order_router)
app.include_router(vehicle_router)
app.include_router(route_router)

@app.get("/")
async def home():
    return {"message": "API is running!"}


class Filters(BaseModel):
    lowCarbon: bool
    evPriority: bool
    emissionZones: bool
    costOptimization: str
    avoidTolls: bool
    fuelEfficiency: bool
    fuelType: str
    vehicleCapacity: str
    avoidTraffic: bool
    timeWindows: bool

@app.post("/run-script")
def run_script(filters: Filters):
    print("Received filters:", filters.dict())
    orders = pd.read_csv("../data/orders_with_coords.csv")
    vehicles = pd.read_csv("../data/delivery_vehicles.csv")
    
    # Configure weights based on filters
    cfg = {
        "output_path": "../data/routes_solution_filtered.csv", 
        "time_limit_sec": 10,
        "w_distance": 1.0,
        "w_emissions": 2.0 if filters.lowCarbon else 1.0,
        "w_on_time": 1.0,
    }
    
    # Filter vehicles based on fuel type preferences
    if filters.evPriority:
        # Prioritize electric vehicles
        vehicles = vehicles.sort_values('fuel_type', key=lambda x: x.map({'electric': 0, 'hybrid': 1, 'diesel': 2, 'gasoline': 3}))
    
    sol = or_tools.solve_routes(orders, vehicles, cfg)
    
    # Return the solution with routes
    return {
        "status": sol.get("status", "error"), 
        "message": "Routes optimized with filters",
        "routes": sol.get("routes", []),
        "filters_applied": filters.dict()
    }

