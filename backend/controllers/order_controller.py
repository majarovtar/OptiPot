import csv
import os
from typing import List
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.order import Order

class OrderController:
    @staticmethod
    def get_all_orders() -> List[Order]:
        orders = []
        # Get the absolute path to the data directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        project_root = os.path.dirname(backend_dir)
        csv_path = os.path.join(project_root, "data", "orders_with_coords.csv")
        
        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as file:
                csv_reader = csv.DictReader(file)
                for row in csv_reader:
                    order = Order(
                        order_id=row['OrderID'],
                        weight=float(row['Weight(kg)']),
                        priority=row['Priority'],
                        window_start=row['WindowStart'],
                        window_end=row['WindowEnd'],
                        street=row['street'],
                        house_number=row['house_number'],
                        postal_code=row['postal_code'] if row['postal_code'] else None,
                        city=row['city'] if row['city'] else None,
                        latitude=float(row['lat']) if row.get('lat') else None,
                        longitude=float(row['lon']) if row.get('lon') else None
                    )
                    orders.append(order)
        except FileNotFoundError:
            print(f"Orders CSV file not found at {csv_path}")
            # Also print current working directory for debugging
            print(f"Current working directory: {os.getcwd()}")
        except Exception as e:
            print(f"Error reading orders CSV: {e}")
            import traceback
            traceback.print_exc()
        
        return orders
    
    @staticmethod
    def get_order_by_id(order_id: str) -> Order:
        orders = OrderController.get_all_orders()
        for order in orders:
            if order.order_id == order_id:
                return order
        return None