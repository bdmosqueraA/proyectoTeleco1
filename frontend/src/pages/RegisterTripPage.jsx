import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoutes, createTrip } from '../api/tripApi';

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const WEATHER_OPTIONS = [
  { value: 'SOLEADO', label: 'Soleado' },
  { value: 'NUBLADO', label: 'Nublado' },
  { value: 'LLUVIOSO', label: 'Lluvioso' },
];

const ACADEMIC_WEEKS = Array.from({ length: 18 }, (_, i) => {
  const week = i + 1;
  let label = `Semana ${week}`;
  if (week === 1) label += ' — Inicio de semestre';
  if (week === 8) label += ' — Parciales';
  if (week === 12) label += ' — Parciales';
  if (week === 16) label += ' — Finales';
  if (week === 17 || week === 18) label += ' — Cierre de semestre';
  return { value: week, label };
});

export default function RegisterTripPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({
    route_id: '',
    departure_date: '',
    departure_hour: '',
    passenger_count: '',
    bus_id: '',
    weather: 'SOLEADO',
    academic_week: '1',
    special_event: false,
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
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Combine date + time into a single ISO datetime
      const departureISO = new Date(`${form.departure_date}T${form.departure_hour}`).toISOString();
      await createTrip(token, {
        route_id: form.route_id,
        departure_time: departureISO,
        passenger_count: Number(form.passenger_count),
        bus_id: form.bus_id,
        weather: form.weather,
        academic_week: Number(form.academic_week),
        special_event: form.special_event,
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

        {/* ─── Datos del viaje ─── */}
        <div className="form-section-title">Datos del viaje</div>

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

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="departure_date">Fecha de salida</label>
            <input
              id="departure_date"
              name="departure_date"
              className="form-input"
              type="date"
              value={form.departure_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="departure_hour">Hora de salida</label>
            <input
              id="departure_hour"
              name="departure_hour"
              className="form-input"
              type="time"
              value={form.departure_hour}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
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

        {/* ─── Variables de contexto (ML) ─── */}
        <div className="form-divider" />
        <div className="form-section-title">Variables de contexto</div>
        <p className="form-section-desc">
          Estas variables alimentan el modelo de predicción de demanda.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="weather">Clima</label>
            <select
              id="weather"
              name="weather"
              className="form-select"
              value={form.weather}
              onChange={handleChange}
            >
              {WEATHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="academic_week">Semana académica</label>
            <select
              id="academic_week"
              name="academic_week"
              className="form-select"
              value={form.academic_week}
              onChange={handleChange}
            >
              {ACADEMIC_WEEKS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              name="special_event"
              checked={form.special_event}
              onChange={handleChange}
              className="form-checkbox"
            />
            <span className="form-checkbox-custom" />
            <span>Hay evento especial hoy</span>
          </label>
          <p className="form-hint">Ej: semana de inducción, evento deportivo, feria, asamblea, etc.</p>
        </div>

        {/* ─── Notas ─── */}
        <div className="form-divider" />

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
