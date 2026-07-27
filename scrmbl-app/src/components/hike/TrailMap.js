
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { THEME } from "../../constants";
import { getTrailGeometry } from "../../utils/api";
import Empty from "../ui/Empty";

/* Renders a hike's route as a polyline over OSM tiles, fetched (and cached
   server-side) from the backend's /api/trails/:id/geometry. Self-contained:
   the only place in the app that imports leaflet or react-leaflet, and the
   only place that knows trail geometry is a separate fetch, not a field on
   the hike object itself. */
function TrailMap({ hike }) {
  const [points, setPoints] = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    setPoints(null);
    getTrailGeometry(hike.id, {
      name: hike.name,
      lat: hike.location?.lat,
      long: hike.location?.long,
      mi: hike.mi,
    })
      .then((d) => { if (!cancelled) setPoints(d.points); })
      .catch(() => { if (!cancelled) setPoints([]); });
    return () => { cancelled = true; };
  }, [hike.id, hike.name, hike.location?.lat, hike.location?.long, hike.mi]);

  if (points === null) {
    return <Empty icon={MapPin} title="Loading map…" />;
  }
  if (points.length < 2) {
    return <Empty icon={MapPin} title="No map yet" subtitle="This trail doesn't have route data plotted yet." />;
  }

  const start = points[0];
  const end = points[points.length - 1];

  return (
    <div style={{ marginTop: 4, borderRadius: 14, overflow: "hidden", border: `1px solid ${THEME.hairline}` }}>
      <MapContainer
        bounds={points}
        boundsOptions={{ padding: [24, 24] }}
        style={{ height: 260, width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Casing: a wider dark outline under the route so it reads clearly
            against the tile's own roads/paths, whatever color those are. */}
        <Polyline positions={points}
          pathOptions={{ color: THEME.slateDeep, weight: 8, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
        <Polyline positions={points}
          pathOptions={{ color: THEME.mintLight, weight: 4, lineCap: "round", lineJoin: "round" }} />
        <CircleMarker center={start} radius={6}
          pathOptions={{ color: THEME.slateDeep, weight: 2, fillColor: "#fff", fillOpacity: 1 }} />
        <CircleMarker center={end} radius={7}
          pathOptions={{ color: THEME.slateDeep, weight: 2, fillColor: THEME.mintLight, fillOpacity: 1 }} />
      </MapContainer>
    </div>
  );
}

export default TrailMap;
