from fastapi import APIRouter, HTTPException
from typing import List
from models.vehicle import Vehicle
from controllers.vehicle_controller import VehicleController

router = APIRouter(
    prefix="/vehicles",
    tags=["vehicles"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Vehicle])
async def get_all_vehicles():
    """
    Get all vehicles from the CSV file
    """
    return VehicleController.get_all_vehicles()

@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle_by_id(vehicle_id: str):
    """
    Get a specific vehicle by ID
    """
    vehicle = VehicleController.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle