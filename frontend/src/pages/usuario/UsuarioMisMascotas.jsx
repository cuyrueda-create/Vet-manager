import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axiosConfig';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';

const especieConfig = {
  Perro: { emoji: '🐕', bg: '#e0f2fe', border: '#7dd3fc', label: 'Perro' },
  Gato: { emoji: '🐈', bg: '#fef3c7', border: '#fcd34d', label: 'Gato' },
  Ave: { emoji: '🦜', bg: '#d1fae5', border: '#6ee7b7', label: 'Ave' },
  Conejo: { emoji: '🐇', bg: '#ede9fe', border: '#c4b5fd', label: 'Conejo' },
  Otro: { emoji: '🐾', bg: '#f1f5f9', border: '#cbd5e1', label: 'Otro' }
};

const UsuarioMisMascotas = () => {
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '', especie: 'Perro', raza: '',
    sexo: 'Desconocido', edad: '', peso: '', observaciones: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const mascotasRes = await api.get('/api/mascotas');
      setMascotas(mascotasRes.data || []);
    } catch {
      setError('Error al cargar tus mascotas');
    }
    try {
      const clienteRes = await api.get('/api/usuario/mi-cliente');
      setCliente(clienteRes.data);
    } catch (err) {
      setError(prev => prev ? prev + ' | ' + (err.response?.data?.detail || 'Error al cargar perfil de cliente') : (err.response?.data?.detail || 'Error al cargar perfil de cliente'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formatted = name === 'nombre' && value.length > 0
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value;
    setForm({ ...form, [name]: formatted });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cliente) {
      setError('No se pudo identificar tu perfil de cliente. Recarga la página.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        id_cliente: cliente.id_cliente,
        ...form,
        edad: form.edad ? Number(form.edad) : null,
        peso: form.peso ? Number(form.peso) : null
      };
      await api.post('/api/mascotas', payload);
      setShowModal(false);
      setForm({ nombre: '', especie: 'Perro', raza: '', sexo: 'Desconocido', edad: '', peso: '', observaciones: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar mascota');
    } finally {
      setSaving(false);
    }
  };

  const eliminarMascota = async (m) => {
    if (!window.confirm(`¿Eliminar a ${m.nombre}? Se eliminarán también sus citas e historial clínico.`)) return;
    setError('');
    try {
      await api.delete(`/api/mascotas/${m.id_mascota}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar la mascota');
    }
  };

  const totalMascotas = mascotas.length;
  const totalPerros = mascotas.filter(m => m.especie === 'Perro').length;
  const totalGatos = mascotas.filter(m => m.especie === 'Gato').length;

  return (
    <div>
      <Navbar />
      <div className="listado-container">

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16, marginBottom: 28
        }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Mis Mascotas
            </h1>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
              Administra las mascotas registradas a tu nombre
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Icon name="plus" size={18} /> Registrar Mascota
            </button>
            <Link to="/usuario/nueva-cita" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
              background: 'white', color: '#334155', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s'
            }}>
              <Icon name="calendar" size={18} /> Agendar Cita
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!loading && mascotas.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12, marginBottom: 24
          }}>
            {[
              { label: 'Total Mascotas', value: totalMascotas, icon: 'paw', color: '#3b82f6', bg: '#eff6ff' },
              { label: 'Perros', value: totalPerros, icon: 'paw', color: '#0284c7', bg: '#e0f2fe' },
              { label: 'Gatos', value: totalGatos, icon: 'paw', color: '#d97706', bg: '#fef3c7' },
              { label: 'Otras', value: totalMascotas - totalPerros - totalGatos, icon: 'paw', color: '#7c3aed', bg: '#ede9fe' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: stat.bg, borderRadius: 12, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  <Icon name={stat.icon} size={20} style={{ color: stat.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20, color: '#b91c1c', fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando...</p></div>

        /* Empty State */
        ) : mascotas.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 16, padding: '60px 40px',
            textAlign: 'center', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#f0f7ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Icon name="paw" size={36} style={{ color: '#3b82f6' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
              Aún no tienes mascotas
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Registra tu primera mascota para poder agendar citas y consultar su historial clínico
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: 15,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
              }}
            >
              <Icon name="plus" size={18} /> Registrar Mi Primera Mascota
            </button>
          </div>

        /* Pet Grid */
        ) : (
          <div className="pet-grid">
            {mascotas.map(m => {
              const config = especieConfig[m.especie] || especieConfig.Otro;
              return (
                <div key={m.id_mascota} className="pet-card" style={{ overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    background: `linear-gradient(90deg, ${config.border}, ${config.bg})`
                  }} />
                  <div className="pet-avatar" style={{
                    background: config.bg, width: 64, height: 64, borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, flexShrink: 0, border: `2px solid ${config.border}`
                  }}>
                    {config.emoji}
                  </div>
                  <div className="pet-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        {m.nombre}
                      </h3>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: config.bg, color: config.border, border: `1px solid ${config.border}`
                      }}>
                        {config.label}
                      </span>
                    </div>
                    <div className="pet-details" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {m.raza && <span className="pet-tag">{m.raza}</span>}
                      <span className="pet-tag">{m.sexo === 'M' ? 'Macho' : m.sexo === 'H' ? 'Hembra' : m.sexo}</span>
                      {m.edad != null && <span className="pet-tag">{m.edad} {m.edad === 1 ? 'año' : 'años'}</span>}
                      {m.peso && <span className="pet-tag">{m.peso} kg</span>}
                    </div>
                    {m.observaciones && (
                      <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                        "{m.observaciones}"
                      </p>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0
                  }}>
                    <Link to="/usuario/nueva-cita" style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                      background: 'white', color: '#3b82f6', fontWeight: 500, fontSize: 12,
                      cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s'
                    }}>
                      <Icon name="calendar" size={14} /> Cita
                    </Link>
                    <button
                      onClick={() => eliminarMascota(m)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca',
                        background: 'white', color: '#dc2626', fontWeight: 500, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Icon name="trash" size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Registrar Mascota */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
              Registrar Mascota
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              Completa los datos de tu mascota
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Nombre de la mascota *
                </label>
                <input type="text" name="nombre" value={form.nombre}
                  onChange={handleChange} placeholder="Ej. Max, Luna..." required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    transition: 'border 0.2s', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Especie *
                </label>
                <select name="especie" value={form.especie} onChange={handleChange} required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    background: 'white', boxSizing: 'border-box'
                  }}>
                  <option value="Perro">🐕 Perro</option>
                  <option value="Gato">🐈 Gato</option>
                  <option value="Ave">🦜 Ave</option>
                  <option value="Conejo">🐇 Conejo</option>
                  <option value="Otro">🐾 Otro</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Raza
                </label>
                <input type="text" name="raza" value={form.raza}
                  onChange={handleChange} placeholder="Ej. Labrador"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box'
                  }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Sexo
                </label>
                <select name="sexo" value={form.sexo} onChange={handleChange}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    background: 'white', boxSizing: 'border-box'
                  }}>
                  <option value="Desconocido">Desconocido</option>
                  <option value="M">Macho</option>
                  <option value="H">Hembra</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Edad (años)
                </label>
                <input type="number" name="edad" value={form.edad}
                  onChange={handleChange} placeholder="Ej. 3" min="0"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box'
                  }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Peso (kg)
                </label>
                <input type="number" name="peso" value={form.peso}
                  onChange={handleChange} placeholder="Ej. 12.5" min="0" step="0.01"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box'
                  }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Observaciones
                </label>
                <textarea name="observaciones" value={form.observaciones}
                  onChange={handleChange} placeholder="Notas adicionales sobre tu mascota..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box'
                  }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none',
                  background: saving ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', fontWeight: 600, fontSize: 14,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s'
                }}>
                {saving ? 'Guardando...' : 'Guardar Mascota'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default UsuarioMisMascotas;
