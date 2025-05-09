# Address-to-School-District Lookup System

## Overview

This project provides a fully automated address-to-school-district lookup system using Node.js, Turf.js, and React. It geocodes user addresses and finds the corresponding school district using official GIS shapefiles.

---

## Directory Structure

- `backend/` — Node.js + Express API, uses Turf.js for geospatial lookup
- `frontend/` — React app for user input and result display
- `backend/data/` — Place your `school_districts.geojson` file here

---

## Setup Instructions

### 1. Prepare Data
- Download the latest school district boundaries as GeoJSON (e.g., from https://www.gis.leg.mn/html/download.html)
- Place the file in `backend/data/school_districts.geojson`

### 2. Backend
```bash
cd backend
npm install
npm start
```
- Runs on `http://localhost:4000`

### 3. Frontend
```bash
cd frontend
npm install
npm start
```
- Runs on `http://localhost:3000`

### 4. Usage
- Open the frontend in your browser
- Enter an address and get the school district result

---

## Notes
- Geocoding uses OpenStreetMap Nominatim (rate-limited; for production, use a paid provider)
- For large-scale or production use, consider moving polygons to PostGIS
- For Minnesota, use the LCC GIS shapefiles for best accuracy 