import express from 'express';
import axios from 'axios';
import * as turf from '@turf/turf';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import schoolLookup from './data/district_school_lookup.json' assert { type: 'json' };

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load district polygons (GeoJSON)
const districts = JSON.parse(fs.readFileSync('./data/school_districts.geojson'));

// Try to import node-postal for address normalization
let normalizeAddress = (address) => address;
try {
  const postal = await import('node-postal');
  normalizeAddress = (address) => {
    const parsed = postal.parser.parse_address(address);
    return parsed.map(part => part.value).join(' ');
  };
} catch (e) {
  // Improved fallback normalization for highways and routes
  normalizeAddress = (address) => {
    let norm = address;
    // Convert '815 10 hwy' or '815 10 highway' to '815 US-10' or '815 Highway 10'
    norm = norm.replace(/(\d+)\s+(\d+)\s*hwy\b/gi, '$1 US-$2');
    norm = norm.replace(/(\d+)\s+(\d+)\s*highway\b/gi, '$1 Highway $2');
    norm = norm.replace(/(\d+)\s+(us|state|mn|county)\s*(\d+)/gi, '$1 $2-$3');
    norm = norm.replace(/\b(\d+) hwy\b/gi, 'Highway $1');
    norm = norm.replace(/\b(\d+) highway\b/gi, 'Highway $1');
    norm = norm.replace(/\b(\d+) us-?\b/gi, 'US-$1');
    norm = norm.replace(/\b(\d+) state\b/gi, 'State Highway $1');
    norm = norm.replace(/\s+/g, ' ').trim();
    console.log('Normalized address:', norm);
    return norm;
  };
}

// Geocode address using Nominatim
async function geocode(address) {
  const normalized = normalizeAddress(address);
  console.log('Normalized address:', normalized);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}`;
  const res = await axios.get(url, { headers: { 'User-Agent': 'district-lookup-prod' } });
  if (res.data.length === 0) {
    console.error('Geocoding failed: No results for address:', normalized);
    throw new Error('Address not found. Please enter a more standard or complete address.');
  }
  if (res.data.length > 1) {
    console.warn('Geocoding returned multiple results for address:', normalized, res.data);
  }
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
      const properties = feature.properties;
      const districtId = properties.UNSDLEA || properties.GEOID || properties.DISTRICTID;
      const schoolInfo = schoolLookup[districtId] || {};
      return { properties: { ...properties, ...schoolInfo }, geometry: feature.geometry };
    }
  }
  return null;
}

// API endpoint
app.post('/lookup', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return res.status(400).json({ error: 'Invalid or missing address.' });
    }
    const [lon, lat] = await geocode(address);
    const district = findDistrict(lon, lat);
    if (!district) {
      console.warn('No district found for location:', lon, lat, 'address:', address);
      return res.status(404).json({ error: 'District not found for this address. Try a more standard address format.' });
    }
    res.json({ district, location: { lon, lat } });
  } catch (err) {
    console.error('Lookup error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000')); 