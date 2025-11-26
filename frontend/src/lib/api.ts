const API_BASE_URL = 'http://localhost:8000';

export interface Order {
  order_id: string;
  weight: number;
  priority: string;
  window_start: string;
  window_end: string;
  street: string;
  house_number: string;
  postal_code: string | null;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
}

export interface Vehicle {
  vehicle_id: string;
  type: string;
  max_capacity_kg: number;
  fuel_type: string;
  emission_g_co2_per_km: number;
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/`);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}