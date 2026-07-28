
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { THEME } from "../../constants";
import { POI_TYPE_BY_ID } from "../../constants/poiTypes";
import { getTrailGeometry } from "../../utils/api";
import Empty from "../ui/Empty";

/* Invisible helper: react-leaflet has no onClick prop on MapContainer
   itself, only this hook-based escape hatch. Tapping an existing marker
   never reaches this handler — Leaflet's vector layers (CircleMarker) don't
   bubble click events to the map by default. */
function MapTapCapture({ onTap }) {
  useMapEvents({ click(e) { onTap?.(e.latlng.lat, e.latlng.lng); } });
  return null;
}

/* Renders a hike's route as a polyline over OSM tiles, fetched (and cached
   server-side) from the backend's /api/trails/:id/geometry. Self-contained:
   the only place in the app that imports leaflet or react-leaflet, and the
   only place that knows trail geometry is a separate fetch, not a field on
   the hike object itself. */
function TrailMap({ hike, userTrack, photoPins, onOpenPhoto, pois, onMapTap, onSelectPoi }) {
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
  const hasTrail = points.length >= 2;
  const hasTrack = userTrack && userTrack.length >= 2;
  const pins = photoPins || [];
  const hasPins = pins.length > 0;
  const tips = pois || [];
  const hasTips = tips.length > 0;
  if (!hasTrail && !hasTrack && !hasPins && !hasTips) {
    return <Empty icon={MapPin} title="No map yet" subtitle="This trail doesn't have route data plotted yet." />;
  }

  const bounds = [
    ...(hasTrail ? points : []),
    ...(hasTrack ? userTrack : []),
    ...(hasPins ? pins.map((p) => [p.lat, p.lng]) : []),
    ...(hasTips ? tips.map((p) => [p.lat, p.lng]) : []),
  ];

  return (
    <div style={{ marginTop: 4, borderRadius: 14, overflow: "hidden", border: `1px solid ${THEME.hairline}` }}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [24, 24], maxZoom: 15 }}
        style={{ height: 260, width: "100%" }}
        scrollWheelZoom={false}
      >
        {onMapTap && <MapTapCapture onTap={onMapTap} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasTrail && (
          <>
            {/* Casing: a wider dark outline under the route so it reads clearly
                against the tile's own roads/paths, whatever color those are. */}
            <Polyline positions={points}
              pathOptions={{ color: THEME.slateDeep, weight: 8, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={points}
              pathOptions={{ color: THEME.mintLight, weight: 4, lineCap: "round", lineJoin: "round" }} />
            <CircleMarker center={points[0]} radius={6}
              pathOptions={{ color: THEME.slateDeep, weight: 2, fillColor: "#fff", fillOpacity: 1 }} />
            <CircleMarker center={points[points.length - 1]} radius={7}
              pathOptions={{ color: THEME.slateDeep, weight: 2, fillColor: THEME.mintLight, fillOpacity: 1 }} />
          </>
        )}
        {hasTrack && (
          <>
            {/* Dashed and a different accent so a user's own GPS trace never
                gets mistaken for the OSM-sourced trail line above. */}
            <Polyline positions={userTrack}
              pathOptions={{ color: THEME.sky, weight: 4, opacity: 0.95, dashArray: "6, 10", lineCap: "round", lineJoin: "round" }} />
            <CircleMarker center={userTrack[0]} radius={5}
              pathOptions={{ color: THEME.sky, weight: 2, fillColor: "#fff", fillOpacity: 1 }} />
            <CircleMarker center={userTrack[userTrack.length - 1]} radius={6}
              pathOptions={{ color: THEME.sky, weight: 2, fillColor: THEME.sky, fillOpacity: 1 }} />
          </>
        )}
        {hasPins && pins.map((p, i) => (
          <CircleMarker key={i} center={[p.lat, p.lng]} radius={7}
            pathOptions={{ color: THEME.slateDeep, weight: 2, fillColor: THEME.plum, fillOpacity: 1 }}
            eventHandlers={{ click: () => onOpenPhoto?.(p.src) }} />
        ))}
        {hasTips && tips.map((p) => (
          <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={8}
            pathOptions={{ color: THEME.slateDeep, weight: 2, fillColor: POI_TYPE_BY_ID[p.type]?.color || THEME.slateMid, fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelectPoi?.(p) }} />
        ))}
      </MapContainer>
      {(hasTrail && hasTrack) || onMapTap ? (
        <div style={{ color: THEME.textDim, fontSize: 10.5, padding: "6px 10px" }}>
          {hasTrail && hasTrack && <>— Trail &nbsp;·&nbsp; - - Your track{onMapTap ? " · " : ""}</>}
          {onMapTap && "Tap the map to add a tip"}
        </div>
      ) : null}
    </div>
  );
}

export default TrailMap;
