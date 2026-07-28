// Parses a .gpx file into a capped [lat, lon] point array for TrailMap.
const MAX_POINTS = 500;

function decimate(points, max) {
  if (points.length <= max) return points;
  const stride = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * stride)]);
  return out;
}

export function parseGpxTrack(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const doc = new DOMParser().parseFromString(String(reader.result), "application/xml");
      if (doc.getElementsByTagName("parsererror").length) {
        reject(new Error("invalid xml"));
        return;
      }
      const points = [...doc.getElementsByTagName("trkpt")]
        .map((pt) => [parseFloat(pt.getAttribute("lat")), parseFloat(pt.getAttribute("lon"))])
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));
      if (points.length < 2) {
        reject(new Error("no track points"));
        return;
      }
      resolve(decimate(points, MAX_POINTS));
    };
    reader.readAsText(file);
  });
}
