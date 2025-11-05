import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Incident {
  _id: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  status: string;
}

interface MapViewProps {
  incidents: Incident[];
  height?: string;
}

export default function MapView({ incidents, height = "400px" }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([40.7128, -74.0060], 10); // Default to NYC

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for incidents
    if (incidents.length > 0) {
      const markers: L.Marker[] = [];
      
      incidents.forEach((incident) => {
        if (incident.location.latitude && incident.location.longitude) {
          // Create custom icon based on severity
          const severityColors = {
            low: '#10B981',      // green
            medium: '#F59E0B',   // yellow
            high: '#F97316',     // orange
            critical: '#EF4444'  // red
          };

          const severityIcons = {
            low: '🟢',
            medium: '🟡', 
            high: '🟠',
            critical: '🔴'
          };

          const customIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${severityColors[incident.severity]};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
              ">
                ${severityIcons[incident.severity]}
              </div>
            `,
            className: 'custom-incident-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([incident.location.latitude, incident.location.longitude], {
            icon: customIcon
          }).addTo(map);

          // Add popup with incident details
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${incident.title}</h3>
              <p class="text-xs text-gray-600 mt-1">Type: ${incident.type}</p>
              <p class="text-xs text-gray-600">Severity: ${incident.severity}</p>
              <p class="text-xs text-gray-600">Status: ${incident.status}</p>
              <p class="text-xs text-gray-500 mt-1">${incident.location.address}</p>
            </div>
          `);

          markers.push(marker);
        }
      });

      // Fit map to show all markers
      if (markers.length > 0) {
        const group = new L.FeatureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [incidents]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="w-full rounded-lg overflow-hidden z-0"
      />
      {incidents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No incidents to display</p>
          </div>
        </div>
      )}
    </div>
  );
}
