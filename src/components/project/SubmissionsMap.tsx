"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ParsedGpsPoint } from "@/lib/kobo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import L from "leaflet";

function FitBounds({ points }: { points: ParsedGpsPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, points]);
  return null;
}

interface Props {
  points: ParsedGpsPoint[];
}

export function SubmissionsMap({ points }: Props) {
  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">GPS submissions map</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No GPS data in submissions yet.</p>
        </CardContent>
      </Card>
    );
  }

  const center: [number, number] = [points[0].lat, points[0].lng];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          GPS submissions map ({points.length} points)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl">
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: "400px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {points.map((pt, i) => (
            <CircleMarker
              key={i}
              center={[pt.lat, pt.lng]}
              radius={6}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.7 }}
            >
              <Popup>
                Lat: {pt.lat.toFixed(5)}, Lng: {pt.lng.toFixed(5)}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
