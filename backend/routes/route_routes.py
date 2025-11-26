from fastapi import APIRouter
from controllers.route_controller import RouteController

router = APIRouter(
    prefix="/routes",
    tags=["routes"],
)


@router.get("/", response_model=dict)
async def get_routes_geojson():
    """Return routes as a GeoJSON FeatureCollection."""
    return RouteController.get_routes_geojson()
