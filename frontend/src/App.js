import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path for Create React App
L.Icon.Default.mergeOptions({
  iconRetinaUrl: process.env.PUBLIC_URL + '/marker-icon-2x.png',
  iconUrl: process.env.PUBLIC_URL + '/marker-icon.png',
  shadowUrl: process.env.PUBLIC_URL + '/marker-shadow.png',
});

function App() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await axios.post('/lookup', { address });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const lat = result?.location?.lat;
  const lon = result?.location?.lon;
  const geometry = result?.district?.geometry;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff 0%, #e6eaf3 100%)', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <style>{`
        @media (max-width: 700px) {
          .usa-main {
            padding: 0.5rem !important;
          }
          .usa-flex {
            flex-direction: column !important;
            gap: 0 !important;
          }
          .usa-map {
            min-width: 0 !important;
            width: 100% !important;
            height: 300px !important;
            margin-top: 1rem !important;
          }
        }
      `}</style>
      {/* Header */}
      <header style={{ background: '#b22234', color: 'white', padding: '1rem 0', boxShadow: '0 2px 8px #0001' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>
            <span role="img" aria-label="US Flag">🇺🇸</span> USASchoolFinder
          </div>
          <nav style={{ fontSize: 16, marginTop: 8 }}>
            <a href="#lookup" style={{ color: 'white', margin: '0 0.5rem', textDecoration: 'none', fontWeight: 600 }}>Lookup</a>
            <a href="#about" style={{ color: 'white', margin: '0 0.5rem', textDecoration: 'none', fontWeight: 600 }}>About</a>
            <a href="#contact" style={{ color: 'white', margin: '0 0.5rem', textDecoration: 'none', fontWeight: 600 }}>Contact</a>
          </nav>
        </div>
      </header>
      {/* Hero Section */}
      <section style={{ background: '#3c3b6e', color: 'white', padding: '2rem 0 1.5rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, margin: 0, fontWeight: 900 }}>Find Your School District</h1>
        <p style={{ fontSize: 16, margin: '1rem 0 0 0', color: '#fff' }}>
          Instantly locate your official school district anywhere in the USA.
        </p>
      </section>
      {/* Lookup Section */}
      <section id="lookup" className="usa-main" style={{ maxWidth: 900, margin: '2rem auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: '2rem' }}>
        <h2 style={{ color: '#b22234', marginTop: 0 }}>School District Lookup</h2>
        <div className="usa-flex" style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter address (e.g. 9200 Inverness Ln NW, Ramsey, MN 55303)"
              style={{ width: '100%', padding: 12, fontSize: 16, border: '2px solid #b22234', borderRadius: 6, marginBottom: 12 }}
            />
            <button onClick={lookup} style={{ width: '100%', padding: 12, fontSize: 16, background: '#3c3b6e', color: 'white', border: 'none', borderRadius: 6, fontWeight: 700 }} disabled={loading}>
              {loading ? 'Looking up...' : 'Lookup'}
            </button>
            {error && <div style={{ color: '#b22234', marginTop: 10, fontWeight: 600 }}>{error}</div>}
            {result && (
              <div style={{ marginTop: 20, fontSize: 16 }}>
                <b>District:</b> {result.district?.properties?.NAME || result.district?.properties?.name || 'No district name found'}
                <br />
                <b>District ID:</b> {result.district?.properties?.UNSDLEA || result.district?.properties?.GEOID || result.district?.properties?.DISTRICTID || 'N/A'}
                <br />
                <b>Elementary School:</b> {result.district?.properties?.elementary || 'N/A'}
                <br />
                <b>Middle School:</b> {result.district?.properties?.middle || 'N/A'}
                <br />
                <b>High School:</b> {result.district?.properties?.high || 'N/A'}
                <br />
                <b>Location:</b> {lat}, {lon}
                <br />
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', color: '#3c3b6e', fontWeight: 600 }}>Show all district data</summary>
                  <table style={{ fontSize: 14, marginTop: 8, borderCollapse: 'collapse' }}>
                    <tbody>
                      {Object.entries(result.district?.properties || {}).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ fontWeight: 600, padding: '2px 8px', border: '1px solid #eee' }}>{k}</td>
                          <td style={{ padding: '2px 8px', border: '1px solid #eee' }}>{v?.toString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </div>
            )}
          </div>
          <div className="usa-map" style={{ flex: 2, minWidth: 320, height: 400 }}>
            {lat && lon && (
              <MapContainer center={[lat, lon]} zoom={12} style={{ height: '100%', width: '100%', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lon]} />
                {geometry && <GeoJSON data={geometry} style={{ color: 'blue', weight: 2 }} />}
              </MapContainer>
            )}
          </div>
        </div>
      </section>
      {/* About Section */}
      <section id="about" style={{ maxWidth: 900, margin: '2rem auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: '2rem' }}>
        <h2 style={{ color: '#3c3b6e', marginTop: 0 }}>About USASchoolFinder</h2>
        <p style={{ fontSize: 16, color: '#222' }}>
          USASchoolFinder is your trusted source for official school district boundaries across the United States. Enter any address and instantly see which public school district it belongs to, visualized on an interactive map. Our data is sourced from the US Census Bureau and state agencies, ensuring accuracy and reliability.
        </p>
      </section>
      {/* Contact Section */}
      <section id="contact" style={{ maxWidth: 900, margin: '2rem auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: '2rem' }}>
        <h2 style={{ color: '#b22234', marginTop: 0 }}>Contact</h2>
        <p style={{ fontSize: 16, color: '#222' }}>
          Questions, feedback, or partnership inquiries? Email us at <a href="mailto:info@usaschoolfinder.com" style={{ color: '#3c3b6e', textDecoration: 'underline' }}>info@usaschoolfinder.com</a>.
        </p>
      </section>
      {/* Footer */}
      <footer style={{ background: '#3c3b6e', color: 'white', textAlign: 'center', padding: '1rem 0', marginTop: 40, fontSize: 14 }}>
        &copy; {new Date().getFullYear()} USASchoolFinder. All rights reserved.
      </footer>
    </div>
  );
}

export default App; 