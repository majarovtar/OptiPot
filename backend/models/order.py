from pydantic import BaseModel
from typing import Optional

class Order(BaseModel):
    order_id: str
    weight: float
    priority: str
    window_start: str
    window_end: str
    street: str
    house_number: str
    postal_code: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "pending"
    
    class Config:
        json_schema_extra = {
            "example": {
                "order_id": "ORD0001",
                "weight": 5.2,
                "priority": "standard",
                "window_start": "08:00",
                "window_end": "12:00",
                "street": "Čopova ulica",
                "house_number": "5",
                "postal_code": "1000",
                "city": "Ljubljana",
                "status": "pending"
            }
        }