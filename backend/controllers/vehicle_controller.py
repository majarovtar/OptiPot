import csv
import os
from typing import List
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.vehicle import Vehicle

class VehicleController:
    @staticmethod
    def get_all_vehicles() -> List[Vehicle]:
        vehicles = []
        # Get the absolute path to the data directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_root = os.path.dirname(backend_dir)
        csv_path = os.path.join(project_root, "data", "delivery_vehicles.csv")
        
        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    vehicle = Vehicle(
                        vehicle_id=row['vehicle_id'],
                        type=row['type'],
                        max_capacity_kg=int(row['max_capacity_kg']),
                        fuel_type=row['fuel_type'],
                        emission_g_co2_per_km=int(row['emission_g_co2_per_km'])
                    )
                    vehicles.append(vehicle)
        except FileNotFoundError:
            print(f"Vehicles CSV file not found at {csv_path}")
            # Also print current working directory for debugging
            print(f"Current working directory: {os.getcwd()}")
        except Exception as e:
            print(f"Error reading vehicles CSV: {e}")
            import traceback
            traceback.print_exc()
        
        return vehicles
    
    @staticmethod
    def get_vehicle_by_id(vehicle_id: str) -> Vehicle:
        vehicles = VehicleController.get_all_vehicles()
        for vehicle in vehicles:
            if vehicle.vehicle_id == vehicle_id:
                return vehicle
        return None