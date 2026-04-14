"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ParsedGpsPoint } from "@/lib/kobo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import L from "leaflet";

// ── Niger State boundary overlay ────────────────────────────────────────────

function NigerStateBoundary() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch(
      "https://nominatim.openstreetmap.org/search" +
        "?q=Niger+State+Nigeria&format=geojson&polygon_geojson=1&limit=1",
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.features?.length > 0) setGeojson(data as GeoJSON.FeatureCollection);
      })
      .catch(() => {/* silently ignore – map still works without boundary */});
  }, []);

  if (!geojson) return null;

  return (
    <GeoJSON
      key="niger-state"
      data={geojson}
      style={{
        color: "#f59e0b",       // amber border
        weight: 2.5,
        dashArray: "6 3",
        fillColor: "#fef3c7",   // very light amber wash
        fillOpacity: 0.12,
      }}
    />
  );
}

// ── Fit map to data-point bounds ────────────────────────────────────────────

function FitBounds({ points }: { points: ParsedGpsPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [map, points]);
  return null;
}

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  points: ParsedGpsPoint[];
  /** Show Niger State boundary highlight (default true) */
  showStateBoundary?: boolean;
}

export function SubmissionsMap({ points, showStateBoundary = true }: Props) {
  // Centre on Niger State even when there are no points yet
  const nigerStateCenter: [number, number] = [9.8, 5.6];
  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : nigerStateCenter;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          GPS submissions map
          {points.length > 0 && (
            <span className="ml-1 font-normal text-muted-foreground">
              ({points.length} {points.length === 1 ? "school" : "schools"})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl">
        <MapContainer
          center={center}
          zoom={points.length === 0 ? 7 : 6}
          style={{ height: "440px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Niger State boundary */}
          {showStateBoundary && <NigerStateBoundary />}

          {/* Fit to data points if we have any */}
          {points.length > 0 && <FitBounds points={points} />}

          {/* School pins */}
          {points.map((pt, i) => (
            <CircleMarker
              key={i}
              center={[pt.lat, pt.lng]}
              radius={pt.count ? Math.min(6 + Math.sqrt(pt.count), 18) : 6}
              pathOptions={{
                color: "#1d4ed8",
                weight: 1.5,
                fillColor: "#3b82f6",
                fillOpacity: 0.75,
              }}
            >
              <Popup>
                {pt.label ? (
                  <div className="text-sm">
                    <p className="font-semibold leading-snug">{pt.label}</p>
                    {pt.count != null && (
                      <p className="text-muted-foreground mt-0.5">
                        {pt.count} student{pt.count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-sm">
                    {pt.lat.toFixed(5)}, {pt.lng.toFixed(5)}
                  </span>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {points.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            No GPS data yet — Niger State boundary shown for reference.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
