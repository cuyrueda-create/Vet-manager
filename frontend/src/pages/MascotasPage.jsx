import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

const MascotasPage = () => {
  const [mascotas, setMascotas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id_cliente: '', nombre: '', especie: 'Perro', raza: '',
    sexo: 'Desconocido', edad: '', peso: '', observaciones: ''
  });
  const [ownerSearch, setOwnerSearch] = useState('');
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [creatingOwner, setCreatingOwner] = useState(false);

  const loadMascotas = () => {
    api.get('/api/mascotas')
      .then(r => setMascotas(r.data || []))
      .catch(() => setError('Error al cargar mascotas'))
      .finally(() => setLoading(false));
  };

  const loadClientes = () => {
    api.get('/api/v1/clientes/')
      .then(r => setClientes(r.data || []))
      .catch(() => setError('Error al cargar clientes'));
  };

  useEffect(() => { loadMascotas(); loadClientes(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const filteredClientes = clientes.filter(c =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  const selectOwner = (c) => {
    setForm({ ...form, id_cliente: c.id_cliente });
    setOwnerSearch(`${c.nombre} ${c.apellido}`);
    setShowOwnerDropdown(false);
  };

  const createOwner = async () => {
    const texto = ownerSearch.trim();
    if (!texto) return;
    const [nombre, ...resto] = texto.split(/\s+/);
    const apellido = resto.join(' ') || '';
    try {
      setCreatingOwner(true);
      setError('');
      const r = await api.post('/api/v1/clientes/', { nombre, apellido });
      const nuevo = { id_cliente: r.data.id_cliente, nombre, apellido };
      setClientes(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      selectOwner(nuevo);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar el dueño');
    } finally {
      setCreatingOwner(false);
    }
  };

  const ownerSelected = clientes.find(c => c.id_cliente === form.id_cliente);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_cliente) {
      setError('Escribe y selecciona el dueño de la mascota');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        edad: form.edad ? Number(form.edad) : null,
        peso: form.peso ? Number(form.peso) : null
      };
      await api.post('/api/mascotas', payload);
      setShowForm(false);
      setForm({
        id_cliente: '', nombre: '', especie: 'Perro', raza: '',
        sexo: 'Desconocido', edad: '', peso: '', observaciones: ''
      });
      setOwnerSearch('');
      loadMascotas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar mascota');
    } finally {
      setSaving(false);
    }
  };

  const eliminarMascota = async (m) => {
    if (!window.confirm(`¿Eliminar a ${m.nombre}? Se eliminarán también sus citas e historial clínico. Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      await api.delete(`/api/mascotas/${m.id_mascota}`);
      loadMascotas();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar la mascota');
    }
  };

  const especieColor = {
    Perro: '#e0f2fe', Gato: '#fef3c7', Ave: '#d1fae5', Conejo: '#ede9fe'
  };

  return (
    <div>
      <Navbar />
      <div className="listado-container">
        <div className="page-header">
          <h1>Mascotas</h1>
          <p className="subtitle">Las mascotas que has registrado</p>
          <button className="btn-primary btn-header"
            onClick={() => { setShowForm(!showForm); loadClientes(); }}>
            {showForm ? 'Cancelar' : '+ Registrar Mascota'}
          </button>
        </div>

        {error && (
          <div className="error-alert">{error}</div>
        )}

        {showForm && (
          <div className="form-card">
            <h3>Registrar Mascota</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Dueño (Cliente)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={ownerSearch}
                      onChange={e => { setOwnerSearch(e.target.value); setForm({ ...form, id_cliente: '' }); setShowOwnerDropdown(true); }}
                      onFocus={() => setShowOwnerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowOwnerDropdown(false), 200)}
                      placeholder="Escribe el nombre del dueño..."
                      autoComplete="off"
                      required={!ownerSelected}
                    />
                    {ownerSelected && (
                      <div className="owner-selected">
                        ✓ {ownerSelected.nombre} {ownerSelected.apellido}
                        {ownerSelected.telefono && ` · ${ownerSelected.telefono}`}
                      </div>
                    )}
                    {showOwnerDropdown && ownerSearch.length > 0 && !ownerSelected && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', maxHeight: 200, overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {filteredClientes.length === 0 ? (
                          <div style={{ padding: 10, color: '#94a3b8', fontSize: 13 }}>No se encontró a "{ownerSearch}"</div>
                        ) : filteredClientes.map(c => (
                          <div key={c.id_cliente}
                            onClick={() => selectOwner(c)}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}
                            onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.target.style.background = 'white'}
                          >
                            <strong>{c.nombre} {c.apellido}</strong>
                            {c.telefono && <span style={{ fontSize: 12, color: '#64748b' }}> · {c.telefono}</span>}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-create-owner"
                          onClick={createOwner}
                          disabled={creatingOwner}
                          onMouseDown={e => e.preventDefault()}
                        >
                          {creatingOwner ? 'Registrando...' : `➕ Registrar dueño nuevo: ${ownerSearch.trim()}`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-field">
                  <label>Nombre</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre de la mascota" required />
                </div>
                <div className="form-field">
                  <label>Especie</label>
                  <select name="especie" value={form.especie} onChange={handleChange} required>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Conejo">Conejo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Raza</label>
                  <input type="text" name="raza" value={form.raza} onChange={handleChange} placeholder="Ej. Labrador" />
                </div>
                <div className="form-field">
                  <label>Sexo</label>
                  <select name="sexo" value={form.sexo} onChange={handleChange}>
                    <option value="Desconocido">Desconocido</option>
                    <option value="M">Macho</option>
                    <option value="H">Hembra</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Edad (años)</label>
                  <input type="number" name="edad" value={form.edad} onChange={handleChange} placeholder="Ej. 3" min="0" />
                </div>
                <div className="form-field">
                  <label>Peso (kg)</label>
                  <input type="number" name="peso" value={form.peso} onChange={handleChange} placeholder="Ej. 12.5" min="0" step="0.01" />
                </div>
                <div className="form-field">
                  <label>Observaciones</label>
                  <input type="text" name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Notas adicionales" />
                </div>
              </div>
              <button type="submit" disabled={saving} className={`btn-submit${saving ? ' disabled' : ''}`}>
                {saving ? 'Guardando...' : 'Guardar Mascota'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando...</p></div>
        ) : mascotas.length === 0 ? (
          <div className="empty-state">
            <p>No has registrado mascotas todavía</p>
          </div>
        ) : (
          <div className="pet-grid">
            {mascotas.map(m => (
              <div key={m.id_mascota} className="pet-card">
                <div className="pet-avatar" style={{ background: especieColor[m.especie] || '#f0f4f8' }}>
                  <Icon name="paw" size={26} style={{ color: '#0066b3' }} />
                </div>
                <div className="pet-info">
                  <h3>{m.nombre}</h3>
                  <div className="pet-details">
                    <span className="pet-tag">{m.especie}</span>
                    {m.raza && <span className="pet-tag">{m.raza}</span>}
                    <span className="pet-tag">{m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}</span>
                    {m.edad != null && <span className="pet-tag">{m.edad} {m.edad === 1 ? 'año' : 'años'}</span>}
                    {m.peso && <span className="pet-tag">{m.peso} kg</span>}
                  </div>
                </div>
                <div className="pet-owner">
                  <span>Dueño</span>
                  <strong>{m.cliente_nombre} {m.cliente_apellido}</strong>
                </div>
                <button className="pet-delete" title="Eliminar" onClick={() => eliminarMascota(m)}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MascotasPage;
