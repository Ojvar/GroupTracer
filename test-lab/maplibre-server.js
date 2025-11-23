// // server.js
// const express = require("express");
// const cors = require("cors");
// const app = express();
// const PORT = 3000;

// // Convert tile X/Y/Z to bounding box (lon/lat)
// function tileToBBox(x, y, z) {
//   const n = Math.pow(2, z);
//   const lon1 = (x / n) * 360 - 180;
//   const lon2 = ((x + 1) / n) * 360 - 180;

//   const latRad1 = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
//   const latRad2 = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
//   const lat1 = (latRad1 * 180) / Math.PI;
//   const lat2 = (latRad2 * 180) / Math.PI;

//   return { min_lon: lon1, min_lat: lat2, max_lon: lon2, max_lat: lat1 };
// }

// // Generate N random points inside a bounding box
// function randomPointsInBBox(bbox, count = 20) {
//   const { min_lon, min_lat, max_lon, max_lat } = bbox;

//   const features = [];
//   for (let i = 0; i < count; i++) {
//     const lon = min_lon + Math.random() * (max_lon - min_lon);
//     const lat = min_lat + Math.random() * (max_lat - min_lat);

//     features.push({
//       type: "Feature",
//       geometry: {
//         type: "Point",
//         coordinates: [lon, lat],
//       },
//       properties: {
//         id: i,
//         value: Math.random(),
//       },
//     });
//   }

//   return {
//     type: "FeatureCollection",
//     features,
//   };
// }

// // Route: /tiles/z/x/y

// app.use(cors());
// app.get("/tiles/:z/:x/:y", (req, res) => {
//   const { x, y, z } = req.params;

//   const bbox = tileToBBox(Number(x), Number(y), Number(z));
//   const geojson = randomPointsInBBox(bbox, 20);

//   res.json(geojson);
// });

// app.listen(PORT, () => {
//   console.log("Tile server running on http://localhost:" + PORT);
// });

// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Convert tile X/Y/Z to bounding box (lon/lat)
function tileToBBox(x, y, z) {
  const n = Math.pow(2, z);
  const lon1 = (x / n) * 360 - 180;
  const lon2 = ((x + 1) / n) * 360 - 180;

  const latRad1 = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const latRad2 = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
  const lat1 = (latRad1 * 180) / Math.PI;
  const lat2 = (latRad2 * 180) / Math.PI;

  return { min_lon: lon1, min_lat: lat2, max_lon: lon2, max_lat: lat1 };
}

// Create a circle polygon around (lon, lat)
function createCircle([lon, lat], radiusInMeters = 250, steps = 32) {
  const coords = [];
  const earthRadius = 6378137;

  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;

    const dx = radiusInMeters * Math.cos(theta);
    const dy = radiusInMeters * Math.sin(theta);

    const newLon =
      lon +
      (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const newLat = lat + (dy / earthRadius) * (180 / Math.PI);

    coords.push([newLon, newLat]);
  }

  return { type: "Polygon", coordinates: [coords] };
}

// Generate N random circle polygons inside a bbox
function randomCirclesInBBox(bbox, count = 20) {
  const { min_lon, min_lat, max_lon, max_lat } = bbox;

  const step = (max_lon - min_lon) / count;

  const features = [];
  for (let i = 0; i < count; i++) {
    const lon = min_lon + i * step * (max_lon - min_lon);
    const lat = min_lat + i * step * (max_lat - min_lat);

    features.push({
      type: "Feature",
      geometry: createCircle([lon, lat], 250), // 250m radius
      properties: { id: i, value: Math.random() },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

// API route
app.use(cors());
app.get("/tiles/:z/:x/:y", (req, res) => {
  const { x, y, z } = req.params;

  const bbox = tileToBBox(Number(x), Number(y), Number(z));
  const geojson = randomCirclesInBBox(bbox, 5);

  res.json(geojson);
});

// Start server
app.listen(PORT, () => {
  console.log("Tile server running on http://localhost:" + PORT);
});
