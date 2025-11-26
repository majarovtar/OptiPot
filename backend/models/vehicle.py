from pydantic import BaseModel

class Vehicle(BaseModel):
    vehicle_id: str
    type: str
    max_capacity_kg: int
    fuel_type: str
    emission_g_co2_per_km: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "vehicle_id": "V001",
                "type": "truck",
                "max_capacity_kg": 7319,
                "fuel_type": "diesel",
                "emission_g_co2_per_km": 300
            }
        }