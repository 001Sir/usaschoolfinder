import express from 'express';
import axios from 'axios';
import * as turf from '@turf/turf';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load district polygons (GeoJSON)
const districts = JSON.parse(fs.readFileSync('./data/school_districts.geojson'));

// Geocode address using Nominatim
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await axios.get(url, { headers: { 'User-Agent': 'district-lookup-prod' } });
  if (res.data.length === 0) throw new Error('Address not found');
  return [parseFloat(res.data[0].lon), parseFloat(res.data[0].lat)];
}

// Point-in-polygon lookup
function findDistrict(lon, lat) {
  const pt = turf.point([lon, lat]);
  console.log('Lookup point:', lon, lat);
  // Log the first polygon for inspection
  if (districts.features.length > 0) {
    console.log('First district properties:', districts.features[0].properties);
    console.log('First district geometry:', JSON.stringify(districts.features[0].geometry).slice(0, 500));
  }
  for (const feature of districts.features) {
    if (turf.booleanPointInPolygon(pt, feature)) {
      return { properties: feature.properties, geometry: feature.geometry };
    }
  }
  return null;
}

// API endpoint
app.post('/lookup', async (req, res) => {
  try {
    const { address } = req.body;
    const [lon, lat] = await geocode(address);
    const district = findDistrict(lon, lat);
    if (!district) return res.status(404).json({ error: 'District not found' });
    res.json({ district, location: { lon, lat } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000')); 