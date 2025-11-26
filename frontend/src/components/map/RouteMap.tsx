import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "../ui/card";
import { MapPin } from "lucide-react";
import RouteLegend from "./RouteLegend";

const DEPOT: [number, number] = [14.459560361232214, 46.0506713158607];

interface RouteMapProps {
  deliveries?: any[];
  filters?: {
    avoidTolls?: boolean;
    avoidTraffic?: boolean;
    lowCarbon?: boolean;
    evPriority?: boolean;
  };
}

export function RouteMap({ deliveries = [], filters = {} }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Array<any>>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  const appendLog = (msg: string) => setDebugLogs(s => [msg, ...s].slice(0, 200));
  const [routesData, setRoutesData] = useState<any>(null);
  const originalWaypointsRef = useRef<any>(null);
  const [vehicleTypeMap, setVehicleTypeMap] = useState<Record<string, string>>({});
  
  // Log when filters change
  useEffect(() => {
    console.log('RouteMap filters changed:', filters);
  }, [filters]);

  useEffect(() => {
    const token = (import.meta as any).env.VITE_MAPBOX_TOKEN;
    if (!token) {
      appendLog("No Mapbox token found in VITE_MAPBOX_TOKEN");
      return;
    }

    mapboxgl.accessToken = token;

    // create map
    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEPOT,
      zoom: 12,
    });

    const currentMap = map.current;
    currentMap.addControl(new mapboxgl.NavigationControl(), "top-right");

    currentMap.on("load", async () => {
      appendLog("Map loaded — fetching routes CSV");

      // Function to fetch directions between waypoints
      const fetchDirections = async (waypoints: [number, number][]) => {
        if (waypoints.length < 2) return null;
        
        const coordinates = waypoints.map(w => w.join(',')).join(';');
        
        // Build URL with optional parameters based on filters
        let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`;
        
        // Add exclude parameter if avoiding tolls
        const excludeParams: string[] = [];
        if (filters.avoidTolls) {
          excludeParams.push('toll');
        }
        if (excludeParams.length > 0) {
          url += `&exclude=${excludeParams.join(',')}`;
        }
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            return data.routes[0].geometry;
          }
        } catch (err) {
          appendLog(`Error fetching directions: ${err}`);
        }
        return null;
      };

      const parseCSVToGeoJSON = (csvText: string) => {
        const lines = csvText.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) return { type: "FeatureCollection", features: [] } as any;
        const header = lines[0].split(",").map(h => h.trim());
        const idx = (name: string) => header.indexOf(name);
        const vidIdx = idx("vehicle_id");
        const latIdx = idx("lat");
        const lonIdx = idx("lon");
        const typeIdx = idx("vehicle_type");

        // store per-vehicle data with optional type
        const vehicles: Record<string, { coords: Array<[number, number]>, type?: string }> = {};

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",");
          if (row.length <= Math.max(vidIdx, latIdx, lonIdx)) continue;
          const vid = row[vidIdx];
          const lat = parseFloat(row[latIdx]);
          const lon = parseFloat(row[lonIdx]);
          const vtype = typeIdx >= 0 ? (row[typeIdx] || "").trim() : "";
          if (!vid || Number.isNaN(lat) || Number.isNaN(lon)) continue;
          if (!vehicles[vid]) vehicles[vid] = { coords: [], type: vtype || undefined };
          // prefer first non-empty type
          if (!vehicles[vid].type && vtype) vehicles[vid].type = vtype;
          vehicles[vid].coords.push([lon, lat]);
        }

        const features = Object.keys(vehicles).map(v => ({
          type: "Feature",
          properties: { vehicle_id: v, vehicle_type: vehicles[v].type || null },
          geometry: { type: "LineString", coordinates: vehicles[v].coords }
        }));

        return { type: "FeatureCollection", features, vehicleData: vehicles } as any;
      };

          try {
            // Always use default routes for now
            const res = await fetch("/routes_solution.csv");
            if (!res.ok) {
              appendLog(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
              return;
            }
            const text = await res.text();
            const parsed = parseCSVToGeoJSON(text);
            appendLog(`Parsed CSV → GeoJSON features=${parsed.features.length}`);
            
            // Store the parsed data for filter updates
            setRoutesData(parsed);
            originalWaypointsRef.current = parsed;
            
            // Fetch real road directions for each vehicle
            appendLog("Fetching road directions for each vehicle...");
            const enhancedFeatures = await Promise.all(
              parsed.features.map(async (feature: any) => {
                const vehicleId = feature.properties.vehicle_id;
                const waypoints = feature.geometry.coordinates as [number, number][];
                
                // Limit waypoints to avoid API limits (max 25 waypoints per request)
                // Take every Nth waypoint if we have too many
                let waypointsToUse = waypoints;
                if (waypoints.length > 25) {
                  const step = Math.ceil(waypoints.length / 24);
                  waypointsToUse = waypoints.filter((_, idx) => idx === 0 || idx === waypoints.length - 1 || idx % step === 0);
                  appendLog(`Vehicle ${vehicleId}: Using ${waypointsToUse.length} of ${waypoints.length} waypoints`);
                }
                
                const directionsGeometry = await fetchDirections(waypointsToUse);
                
                if (directionsGeometry) {
                  return {
                    ...feature,
                    geometry: directionsGeometry
                  };
                }
                
                // Fallback to straight lines if directions API fails
                return feature;
              })
            );
            
            const geojson = {
              type: "FeatureCollection",
              features: enhancedFeatures
            };
            
            appendLog(`Enhanced ${enhancedFeatures.length} routes with road directions`);

            // Attempt to load vehicle metadata (types) from a CSV placed in frontend/public as /delivery_vehicles.csv
            let vehicleTypeMap: Record<string, string> = {};
            try {
              const metaRes = await fetch('/delivery_vehicles.csv');
              if (metaRes.ok) {
                const metaText = await metaRes.text();
                // Remove BOM if present
                const cleanText = metaText.replace(/^\ufeff/, '');
                const rows = cleanText.split(/\r?\n/).filter(Boolean);
                if (rows.length > 0) {
                  const hdr = rows[0].split(',').map(h=>h.trim());
                  const idIdx = hdr.indexOf('vehicle_id');
                  const typeIdx = hdr.indexOf('type');
                  for (let i=1;i<rows.length;i++){
                    const cols = rows[i].split(',');
                    if (cols.length<=Math.max(idIdx,typeIdx)) continue;
                    const id = cols[idIdx];
                    const t = cols[typeIdx];
                    if (id) vehicleTypeMap[id] = t || '';
                  }
                  appendLog(`Loaded vehicle metadata types=${Object.keys(vehicleTypeMap).length}`);
                  console.log('Vehicle type map loaded:', vehicleTypeMap);
                  setVehicleTypeMap(vehicleTypeMap);
                }
              } else {
                appendLog('No /delivery_vehicles.csv found in public; type buttons will be based on CSV data only');
              }
            } catch (e) {
              appendLog('Error loading delivery_vehicles.csv metadata');
            }

            // add or update source
            if (currentMap.getSource("routes-src")) {
              (currentMap.getSource("routes-src") as mapboxgl.GeoJSONSource).setData(geojson as any);
              appendLog("Updated routes-src data");
            } else {
              currentMap.addSource("routes-src", { type: "geojson", data: geojson as any });


              // collect unique vehicles and coordinates
              const seen: string[] = [];
              const vehicleItems: Array<any> = [];
              const vehicleCoords: Record<string, [number, number][]> = {};
              
              // First, get original waypoints from parsed data for bounds calculation
              (parsed.features || []).forEach((f: any) => {
                const vid = f.properties?.vehicle_id;
                if (vid && !vehicleCoords[vid]) {
                  vehicleCoords[vid] = f.geometry?.coordinates || [];
                }
              });
              
              (geojson.features || []).forEach((f: any) => {
                const vid = f.properties?.vehicle_id;
                if (!vid) return;
                if (!seen.includes(vid)) {
                  seen.push(vid);
                  // Use original waypoints for bounds calculation
                  const originalCoords = vehicleCoords[vid] || [];
                  let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
                  originalCoords.forEach(c => {
                    const [x, y] = c;
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                  });
                  const bounds = [[minX, minY], [maxX, maxY]];
                  vehicleItems.push({ vehicle_id: vid, visible: true, coords: originalCoords, bounds, type: f.properties?.vehicle_type || vehicleTypeMap[vid] || undefined });
                }
              });

              // Assign visually distinct colors using golden-ratio spacing across hues
              const n = vehicleItems.length;
              const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
              vehicleItems.forEach((v, i) => {
                // Use either even spacing or golden ratio to spread hues
                const hue = Math.round(((i * 360) / n) % 360);
                // Alternatively: const hue = Math.round(((i * GOLDEN_RATIO_CONJUGATE * 360) % 360));
                v.color = `hsl(${hue},78%,45%)`;
              });

              setVehicles(vehicleItems);

              // collect unique vehicle types
              const typesSet = new Set<string>();
              vehicleItems.forEach(v => { if (v && v.type) typesSet.add(String(v.type)); });
              setVehicleTypes(Array.from(typesSet));

              const matchExpr: any[] = ["match", ["get", "vehicle_id"]];
              vehicleItems.forEach(v => { matchExpr.push(v.vehicle_id, v.color); });
              matchExpr.push("#000000");

              currentMap.addLayer({
                id: "routes-lines",
                type: "line",
                source: "routes-src",
                layout: { "line-join": "round", "line-cap": "round" },
                paint: { "line-width": 4, "line-color": matchExpr as any, "line-opacity": 0.9 }
              });
              appendLog("Added routes-lines layer");
              
              // Add delivery stop markers
              const stopsGeoJSON = {
                type: "FeatureCollection" as const,
                features: [] as any[]
              };
              
              // Create markers for delivery stops (exclude depot stops)
              Object.entries(vehicleCoords).forEach(([vehicleId, coords]) => {
                const vehicleItem = vehicleItems.find(v => v.vehicle_id === vehicleId);
                if (!vehicleItem) return;
                
                coords.forEach((coord, idx) => {
                  // Skip the first and last point (depot)
                  if (idx === 0 || idx === coords.length - 1) return;
                  
                  stopsGeoJSON.features.push({
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: coord
                    },
                    properties: {
                      vehicle_id: vehicleId,
                      stop_number: idx,
                      color: vehicleItem.color
                    }
                  });
                });
              });
              
              currentMap.addSource('delivery-stops', {
                type: 'geojson',
                data: stopsGeoJSON
              });
              
              currentMap.addLayer({
                id: 'delivery-stops-circle',
                type: 'circle',
                source: 'delivery-stops',
                paint: {
                  'circle-radius': 6,
                  'circle-color': ['get', 'color'],
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }
              });
              
              // Add depot marker
              new mapboxgl.Marker({ color: '#3b82f6' })
                .setLngLat(DEPOT)
                .setPopup(new mapboxgl.Popup().setHTML('<div style="padding: 8px;"><strong>DEPOT</strong><br/>Starting Point</div>'))
                .addTo(currentMap);
              
              // Add click event for routes
              currentMap.on('click', 'routes-lines', (e) => {
                if (!e.features || e.features.length === 0) return;
                
                const feature = e.features[0];
                const vehicleId = feature.properties?.vehicle_id;
                const vehicleType = feature.properties?.vehicle_type || vehicleTypeMap[vehicleId] || 'Unknown';
                const vehicleItem = vehicleItems.find(v => v.vehicle_id === vehicleId);
                const vehicleColor = vehicleItem?.color || '#000';
                
                // Create popup content
                const popupContent = `
                  <div style="padding: 12px; min-width: 200px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <div style="width: 16px; height: 16px; background-color: ${vehicleColor}; border-radius: 50%;"></div>
                      <strong style="font-size: 16px;">${vehicleId}</strong>
                    </div>
                    <div style="color: #666; margin-bottom: 4px;">
                      <strong>Type:</strong> ${vehicleType}
                    </div>
                    <div style="color: #666;">
                      <strong>Stops:</strong> ${vehicleCoords[vehicleId]?.length ? vehicleCoords[vehicleId].length - 2 : 0} deliveries
                    </div>
                  </div>
                `;
                
                // Show popup at click location
                new mapboxgl.Popup()
                  .setLngLat(e.lngLat)
                  .setHTML(popupContent)
                  .addTo(currentMap);
              });
              
              // Change cursor on route hover
              currentMap.on('mouseenter', 'routes-lines', () => {
                currentMap.getCanvas().style.cursor = 'pointer';
              });
              
              currentMap.on('mouseleave', 'routes-lines', () => {
                currentMap.getCanvas().style.cursor = '';
              });
              
              // Add click event for delivery stops
              currentMap.on('click', 'delivery-stops-circle', (e) => {
                if (!e.features || e.features.length === 0) return;
                
                const feature = e.features[0];
                const vehicleId = feature.properties?.vehicle_id;
                const stopNumber = feature.properties?.stop_number;
                
                const popupContent = `
                  <div style="padding: 8px;">
                    <strong>${vehicleId}</strong><br/>
                    Stop #${stopNumber}
                  </div>
                `;
                
                new mapboxgl.Popup()
                  .setLngLat(feature.geometry.coordinates)
                  .setHTML(popupContent)
                  .addTo(currentMap);
              });
              
              // Change cursor on stop hover
              currentMap.on('mouseenter', 'delivery-stops-circle', () => {
                currentMap.getCanvas().style.cursor = 'pointer';
              });
              
              currentMap.on('mouseleave', 'delivery-stops-circle', () => {
                currentMap.getCanvas().style.cursor = '';
              });

              const routeBounds = new mapboxgl.LngLatBounds();
              (geojson.features || []).forEach((f: any) => {
                (f.geometry?.coordinates || []).forEach((c: [number, number]) => routeBounds.extend(c));
              });
              if (!routeBounds.isEmpty()) currentMap.fitBounds(routeBounds, { padding: 80, maxZoom: 14 });
            }
          } catch (err) {
            appendLog(`Error drawing routes: ${String(err)}`);
            console.error(err);
          }
        });

        return () => {
          map.current?.remove();
        };
      }, []);

      // Update layer paint when vehicles or selection changes
      useEffect(() => {
        const m = map.current;
        if (!m) return;
        const layerId = "routes-lines";
        if (!m.getLayer(layerId)) return;

        const opacityExpr: any[] = ["match", ["get", "vehicle_id"]];
        vehicles.forEach((v: any) => {
          const base = v.visible ? 0.9 : 0.0;
          const value = selectedVehicle ? (selectedVehicle === v.vehicle_id ? 1 : (v.visible ? 0.25 : 0)) : base;
          opacityExpr.push(v.vehicle_id, value);
        });
        opacityExpr.push(0);
        try { m.setPaintProperty(layerId, "line-opacity", opacityExpr as any); } catch (e) { console.warn(e); }

        const widthExpr: any[] = ["match", ["get", "vehicle_id"]];
        vehicles.forEach((v: any) => {
          widthExpr.push(v.vehicle_id, selectedVehicle === v.vehicle_id ? 6 : 3);
        });
        widthExpr.push(3);
        try { m.setPaintProperty(layerId, "line-width", widthExpr as any); } catch (e) { console.warn(e); }
        
        // Update stop markers visibility
        if (m.getLayer('delivery-stops-circle')) {
          const stopOpacityExpr: any[] = ["match", ["get", "vehicle_id"]];
          vehicles.forEach((v: any) => {
            const opacity = v.visible ? 1 : 0;
            stopOpacityExpr.push(v.vehicle_id, opacity);
          });
          stopOpacityExpr.push(0);
          try { 
            m.setPaintProperty('delivery-stops-circle', 'circle-opacity', stopOpacityExpr as any);
            m.setPaintProperty('delivery-stops-circle', 'circle-stroke-opacity', stopOpacityExpr as any);
          } catch (e) { console.warn(e); }
        }

      }, [vehicles, selectedVehicle]);
      
      // Filter vehicles based on low carbon filter
      useEffect(() => {
        console.log('Low carbon filter effect triggered');
        console.log('Vehicles:', vehicles.length);
        console.log('VehicleTypeMap:', Object.keys(vehicleTypeMap).length, vehicleTypeMap);
        console.log('Filter lowCarbon:', filters.lowCarbon);
        
        if (!vehicles.length || Object.keys(vehicleTypeMap).length === 0) {
          console.log('Skipping - no vehicles or type map');
          return;
        }
        
        if (filters.lowCarbon) {
          console.log('Applying low carbon filter - showing only electric vehicles');
          // Get electric vehicle IDs from the metadata
          const electricVehicleIds = Object.entries(vehicleTypeMap)
            .filter(([_, type]) => type === 'electric' || type === 'bike')
            .map(([id, _]) => id);
          
          console.log('Electric vehicles found:', electricVehicleIds);
          
          // Hide non-electric vehicles
          setVehicles(prev => {
            const updated = prev.map(v => ({
              ...v,
              visible: electricVehicleIds.includes(v.vehicle_id)
            }));
            console.log('Updated vehicles visibility:', updated);
            return updated;
          });
        } else {
          console.log('Removing low carbon filter - showing all vehicles');
          // Show all vehicles when filter is off
          setVehicles(prev => prev.map(v => ({
            ...v,
            visible: true
          })));
        }
      }, [filters.lowCarbon, vehicleTypeMap]);
      
      // Re-fetch routes when filters change
      useEffect(() => {
        console.log('Filter change detected, avoidTolls:', filters.avoidTolls);
        console.log('Map ready:', !!map.current, 'Style loaded:', map.current?.isStyleLoaded(), 'Routes data:', !!originalWaypointsRef.current);
        
        if (!map.current || !map.current.isStyleLoaded() || !originalWaypointsRef.current) return;
        
        const updateRoutesWithNewFilters = async () => {
          console.log('updateRoutesWithNewFilters called');
          appendLog(`Updating routes with filters: avoidTolls=${filters.avoidTolls}`);
          
          // Re-fetch directions with new filters
          const enhancedFeatures = await Promise.all(
            originalWaypointsRef.current.features.map(async (feature: any) => {
              const vehicleId = feature.properties.vehicle_id;
              const waypoints = feature.geometry.coordinates as [number, number][];
              
              // Function to fetch directions
              const fetchDirectionsWithFilters = async (waypoints: [number, number][]) => {
                if (waypoints.length < 2) return null;
                
                const coordinates = waypoints.map(w => w.join(',')).join(';');
                let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}&overview=full`;
                
                const excludeParams: string[] = [];
                if (filters.avoidTolls) {
                  excludeParams.push('toll');
                }
                if (excludeParams.length > 0) {
                  url += `&exclude=${excludeParams.join(',')}`;
                }
                
                try {
                  const response = await fetch(url);
                  const data = await response.json();
                  if (data.routes && data.routes.length > 0) {
                    return data.routes[0].geometry;
                  }
                } catch (err) {
                  console.error(`Error fetching directions: ${err}`);
                }
                return null;
              };
              
              let waypointsToUse = waypoints;
              if (waypoints.length > 25) {
                const step = Math.ceil(waypoints.length / 24);
                waypointsToUse = waypoints.filter((_, idx) => idx === 0 || idx === waypoints.length - 1 || idx % step === 0);
              }
              
              const directionsGeometry = await fetchDirectionsWithFilters(waypointsToUse);
              
              if (directionsGeometry) {
                return {
                  ...feature,
                  geometry: directionsGeometry
                };
              }
              
              return feature;
            })
          );
          
          const newGeojson = {
            type: "FeatureCollection",
            features: enhancedFeatures
          };
          
          // Update the map source
          const source = map.current.getSource("routes-src");
          if (source && source.type === 'geojson') {
            (source as mapboxgl.GeoJSONSource).setData(newGeojson as any);
          }
          
          appendLog(`Updated routes with ${filters.avoidTolls ? 'toll avoidance' : 'normal routing'}`);
        };
        
        updateRoutesWithNewFilters();
      }, [filters.avoidTolls]);

      return (
        <div className="relative h-full w-full">
          {/* Filter status indicators */}
          <div className="absolute top-3 left-3 z-50 space-y-2">
            {filters.avoidTolls && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md shadow-md text-sm">
                🚧 Avoiding toll roads
              </div>
            )}
            {filters.lowCarbon && (
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-md shadow-md text-sm">
                🌱 Low carbon routes
              </div>
            )}
            {filters.evPriority && (
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md shadow-md text-sm">
                ⚡ EV priority routes
              </div>
            )}
          </div>
          {vehicles.length > 0 && (
            <RouteLegend
              items={vehicles.map(v => ({ vehicle_id: v.vehicle_id, color: v.color, visible: v.visible }))}
              types={vehicleTypes}
              selected={selectedVehicle}
              onSelect={(vid) => {
                const next = selectedVehicle === vid ? null : vid;
                setSelectedVehicle(next);
                // fit bounds to vehicle
                const v = vehicles.find(x => x.vehicle_id === vid);
                if (v && map.current) {
                  try {
                    const b = v.bounds as [[number, number], [number, number]];
                    map.current.fitBounds([[b[0][0], b[0][1]], [b[1][0], b[1][1]]], { padding: 80, maxZoom: 14 });
                  } catch (e) {
                    console.warn("fitBounds failed", e);
                  }
                }
              }}
              onToggle={(vid) => {
                setVehicles(prev => prev.map(p => p.vehicle_id === vid ? { ...p, visible: !p.visible } : p));
              }}
              onSelectAll={() => setVehicles(prev => prev.map(p => ({ ...p, visible: true })))}
              onDeselectAll={() => setVehicles(prev => prev.map(p => ({ ...p, visible: false })))}
              onFilter={(kind) => {
                const k = String(kind || "").toLowerCase();
                setVehicles(prev => prev.map(p => ({ ...p, visible: (p.type ? String(p.type).toLowerCase() === k : false) })));
              }}
            />
          )}
          <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />

          {(!((import.meta as any).env.VITE_MAPBOX_TOKEN)) && (
            <Card className="absolute inset-0 m-4 flex items-center justify-center p-8 bg-background/95 backdrop-blur-sm border-border shadow-lg">
              <div className="max-w-md w-full space-y-4">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-primary mx-auto" />
                  <h3 className="text-xl font-semibold">Mapbox Token Required</h3>
                  <p className="text-sm text-muted-foreground">Please set VITE_MAPBOX_TOKEN in your .env file</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      );
    }

    // default export for compatibility
    export default RouteMap;

