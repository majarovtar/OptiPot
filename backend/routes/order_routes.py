from fastapi import APIRouter, HTTPException
from typing import List
from models.order import Order
from controllers.order_controller import OrderController

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Order])
async def get_all_orders():
    """
    Get all orders from the CSV file
    """
    return OrderController.get_all_orders()

@router.get("/{order_id}", response_model=Order)
async def get_order_by_id(order_id: str):
    """
    Get a specific order by ID
    """
    order = OrderController.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order