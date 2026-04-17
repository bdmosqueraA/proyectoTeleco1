import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoutes, createTrip } from '../api/tripApi';

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function RegisterTripPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({
    route_id: '',
    departure_time: '',
    passenger_count: '',
    bus_id: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRoutes()
      .then((r) => {
        setRoutes(r);
        if (r.length) setForm((f) => ({ ...f, route_id: r[0].id }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTrip(token, {
        route_id: form.route_id,
        departure_time: new Date(form.departure_time).toISOString(),
        passenger_count: Number(form.passenger_count),
        bus_id: form.bus_id,
        notes: form.notes || null,
      });
      navigate('/trips', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Registrar Viaje</h1>
          <p className="page-subtitle">
            Ingresa los datos del recorrido de la ruta
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
          <span className="btn-icon"><IconArrowLeft /></span>
          Dashboard
        </button>
      </div>

      <form className="card animate-in" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label" htmlFor="route_id">Ruta</label>
          <select
            id="route_id"
            name="route_id"
            className="form-select"
            value={form.route_id}
            onChange={handleChange}
            required
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="departure_time">Hora de salida</label>
          <input
            id="departure_time"
            name="departure_time"
            className="form-input"
            type="datetime-local"
            value={form.departure_time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="passenger_count">Pasajeros (0 – 100)</label>
          <input
            id="passenger_count"
            name="passenger_count"
            className="form-input"
            type="number"
            min="0"
            max="100"
            placeholder="42"
            value={form.passenger_count}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="bus_id">ID del bus</label>
          <input
            id="bus_id"
            name="bus_id"
            className="form-input"
            type="text"
            placeholder="BUS-01"
            value={form.bus_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="notes">Notas (opcional)</label>
          <textarea
            id="notes"
            name="notes"
            className="form-textarea"
            placeholder="Observaciones adicionales…"
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Registrar Viaje'}
        </button>
      </form>
    </div>
  );
}
