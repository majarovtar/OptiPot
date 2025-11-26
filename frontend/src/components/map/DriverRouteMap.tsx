import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Delivery {
  id: string;
  orderId: string;
  address: string;
  packages: number;
  status: "pending" | "completed";
  time: string;
  coordinates: { lng: number; lat: number };
  sequenceNumber: number;
}

interface DriverRouteMapProps {
  deliveries: Delivery[];
  driverId: string;
}

const DEPOT_COORDS = { lng: 14.459560361232214, lat: 46.0506713158607 };

export const DriverRouteMap = ({ deliveries, driverId }: DriverRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const deliveriesRef = useRef(deliveries);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  
  // Keep deliveries ref up to date
  useEffect(() => {
    deliveriesRef.current = deliveries;
  }, [deliveries]);

  const initializeMap = () => {
    if (!mapContainer.current) {
      console.error("Map container not found");
      return;
    }

    if (!mapboxToken || mapboxToken.trim() === "" || mapboxToken === "your_mapbox_public_token_here") {
      console.error("Invalid or missing Mapbox token in environment variables");
      return;
    }

    // Clean up any existing map before creating a new one
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/navigation-day-v1", // Navigation-focused style
        center: [DEPOT_COORDS.lng, DEPOT_COORDS.lat],
        zoom: 11,
      });

      const currentMap = map.current;

      currentMap.addControl(new mapboxgl.NavigationControl(), "top-right");
      currentMap.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right"
      );

      // Wait for style load before adding GeoJSON source and layers
      currentMap.on("load", () => {
        // Add depot marker
        new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([DEPOT_COORDS.lng, DEPOT_COORDS.lat])
          .setPopup(new mapboxgl.Popup().setHTML('<div style="padding: 8px;"><strong>DEPOT</strong><br/>Starting Point</div>'))
          .addTo(currentMap);

        // Add GeoJSON source for deliveries
        currentMap.addSource('deliveries', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        // Add route line source
        currentMap.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        // Add route line layer
        currentMap.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.7
          }
        });

        // Add layer for delivery points
        currentMap.addLayer({
          id: 'delivery-points',
          type: 'circle',
          source: 'deliveries',
          paint: {
            'circle-radius': 12,
            'circle-color': [
              'case',
              ['==', ['get', 'status'], 'completed'],
              '#10b981',
              '#f59e0b'
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Add sequence numbers
        currentMap.addLayer({
          id: 'delivery-numbers',
          type: 'symbol',
          source: 'deliveries',
          layout: {
            'text-field': ['get', 'sequenceNumber'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        // Add click event for popups
        currentMap.on('click', 'delivery-points', (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const coordinates = e.features[0].geometry.coordinates.slice();
          const properties = e.features[0].properties;
          
          const popupContent = `
            <div style="padding: 8px;">
              <strong>Stop #${properties.sequenceNumber}</strong><br/>
              <strong>${properties.orderId}</strong><br/>
              <span style="font-size: 12px;">${properties.address}</span><br/>
              <span style="font-size: 12px;">${properties.packages} packages</span><br/>
              <span style="font-size: 12px;">Delivery: ${properties.time}</span><br/>
              <span style="font-size: 11px; color: ${
                properties.status === "completed" ? "#10b981" : "#f59e0b"
              };"><br/>
                ${properties.status === "completed" ? "✓ Completed" : "⏰ Pending"}
              </span>
            </div>
          `;
          
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(currentMap);
        });

        // Change cursor on hover
        currentMap.on('mouseenter', 'delivery-points', () => {
          currentMap.getCanvas().style.cursor = 'pointer';
        });
        
        currentMap.on('mouseleave', 'delivery-points', () => {
          currentMap.getCanvas().style.cursor = '';
        });

        console.log("Driver route map initialized");
        console.log("Deliveries at map init:", deliveriesRef.current.length, deliveriesRef.current);
        
        // Trigger deliveries update after map is loaded
        // Add a small delay to ensure all layers are ready
        setTimeout(async () => {
          if (deliveriesRef.current && deliveriesRef.current.length > 0) {
            console.log("Calling updateDeliveries from map init after delay");
            await updateDeliveries();
          } else {
            console.log("No deliveries yet at map init");
          }
        }, 100);
      });
    } catch (error) {
      console.error("Error setting up map:", error);
    }
  };
  
  const updateDeliveries = async () => {
    console.log('updateDeliveries called, checking map:', {
      mapExists: !!map.current,
      styleLoaded: map.current?.isStyleLoaded(),
      deliveriesLength: deliveries.length
    });
    
    if (!map.current || !map.current.isStyleLoaded() || deliveries.length === 0) {
      console.log('Exiting updateDeliveries early');
      return;
    }
    
    console.log('Updating deliveries on map:', deliveries.length);
    
    // Convert deliveries to GeoJSON format
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: deliveries.map(delivery => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [delivery.coordinates.lng, delivery.coordinates.lat]
        },
        properties: {
          id: delivery.id,
          orderId: delivery.orderId,
          address: delivery.address,
          packages: delivery.packages,
          status: delivery.status,
          time: delivery.time,
          sequenceNumber: delivery.sequenceNumber
        }
      }))
    };

    // Update the deliveries source
    const deliveriesSource = map.current.getSource('deliveries');
    if (deliveriesSource && deliveriesSource.type === 'geojson') {
      deliveriesSource.setData(geojsonData);
    }

    // Create waypoints for route: depot -> deliveries -> depot
    const waypoints: [number, number][] = [
      [DEPOT_COORDS.lng, DEPOT_COORDS.lat], // Start at depot
      ...deliveries.map(d => [d.coordinates.lng, d.coordinates.lat] as [number, number]),
      [DEPOT_COORDS.lng, DEPOT_COORDS.lat] // Return to depot
    ];

    // Fetch directions from Mapbox
    try {
      // Mapbox Directions API has a limit of 25 waypoints
      let routeCoordinates: [number, number][] = [];
      
      // If we have more than 25 waypoints, we need to split the request
      if (waypoints.length <= 25) {
        const coordinates = waypoints.map(w => w.join(',')).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          routeCoordinates = data.routes[0].geometry.coordinates;
        }
      } else {
        // For more than 25 waypoints, break into segments
        console.log('Route has more than 25 waypoints, breaking into segments');
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const start = waypoints[i];
          const end = waypoints[i + 1];
          const coordinates = `${start.join(',')};${end.join(',')}`;
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.routes && data.routes.length > 0) {
            const segmentCoords = data.routes[0].geometry.coordinates;
            // Avoid duplicating the connection point
            if (i > 0) {
              routeCoordinates.push(...segmentCoords.slice(1));
            } else {
              routeCoordinates.push(...segmentCoords);
            }
          }
        }
      }

      // Update route with street-following path
      if (routeCoordinates.length > 0) {
        const routeGeoJSON = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: routeCoordinates
          }
        };

        const routeSource = map.current.getSource('route');
        if (routeSource && routeSource.type === 'geojson') {
          routeSource.setData(routeGeoJSON);
        }
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      // Fallback to straight lines if directions API fails
      const routeGeoJSON = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: waypoints
        }
      };

      const routeSource = map.current.getSource('route');
      if (routeSource && routeSource.type === 'geojson') {
        routeSource.setData(routeGeoJSON);
      }
    }

    // Fit bounds to show entire route
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([DEPOT_COORDS.lng, DEPOT_COORDS.lat]);
    deliveries.forEach(delivery => {
      bounds.extend([delivery.coordinates.lng, delivery.coordinates.lat]);
    });
    map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    
    console.log('updateDeliveries completed successfully');
  };

  useEffect(() => {
    if (mapboxToken && mapboxToken !== "your_mapbox_public_token_here") {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]); // Only depend on mapboxToken to avoid re-initializing

  // Update deliveries and route when data changes
  useEffect(() => {
    console.log('DriverRouteMap deliveries update:', deliveries.length, deliveries);
    if (!map.current || !map.current.isStyleLoaded() || deliveries.length === 0) {
      console.log('Map not ready or no deliveries:', {
        mapExists: !!map.current,
        styleLoaded: map.current?.isStyleLoaded(),
        deliveriesLength: deliveries.length
      });
      return;
    }

    updateDeliveries();
  }, [deliveries]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainer}
        className="absolute inset-0 rounded-lg overflow-hidden"
      />

      {(!mapboxToken || mapboxToken === "your_mapbox_public_token_here") && (
        <Card className="absolute inset-0 m-4 flex items-center justify-center p-8 bg-background/95 backdrop-blur-sm border-border shadow-lg">
          <div className="max-w-md w-full space-y-4">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Mapbox Token Required</h3>
              <p className="text-sm text-muted-foreground">
                Please set VITE_MAPBOX_TOKEN in your .env file
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Driver info overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm font-medium">Driver: {driverId}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {deliveries.length} stops • Navigation view
        </div>
      </div>
    </div>
  );
};