import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTrips } from '../api/tripApi';

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);

const IconInbox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

const WEATHER_LABELS = {
  SOLEADO: { text: 'Soleado', className: 'badge-sunny' },
  NUBLADO: { text: 'Nublado', className: 'badge-cloudy' },
  LLUVIOSO: { text: 'Lluvioso', className: 'badge-rainy' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { timeStyle: 'short' });
}

export default function TripHistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips(token)
      .then(setTrips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Viajes</h1>
          <p className="page-subtitle">{trips.length} viaje(s) registrado(s)</p>
        </div>
        <div className="nav-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/trips/new')}>
            <span className="btn-icon"><IconPlus /></span>
            Nuevo Viaje
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            <span className="btn-icon"><IconArrowLeft /></span>
            Dashboard
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <span className="spinner" />
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-state animate-in">
          <div className="empty-state-icon"><IconInbox /></div>
          <p>No hay viajes registrados aún.</p>
        </div>
      ) : (
        <div className="table-wrapper animate-in">
          <table className="table">
            <thead>
              <tr>
                <th>Ruta</th>
                <th>Bus</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Pasajeros</th>
                <th>Clima</th>
                <th>Sem. Acad.</th>
                <th>Evento</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const w = WEATHER_LABELS[trip.weather] || { text: trip.weather || '—', className: '' };
                return (
                  <tr key={trip.id}>
                    <td>{trip.route_id}</td>
                    <td>{trip.bus_id}</td>
                    <td>{formatDate(trip.departure_time)}</td>
                    <td>{formatTime(trip.departure_time)}</td>
                    <td>{trip.passenger_count}</td>
                    <td><span className={`table-badge ${w.className}`}>{w.text}</span></td>
                    <td>{trip.academic_week ?? '—'}</td>
                    <td>{trip.special_event ? 'Sí' : 'No'}</td>
                    <td>{trip.registered_by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
