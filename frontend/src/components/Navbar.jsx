import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axiosConfig';
import Icon from './Icon';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const navRef = useRef(null);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifs = () => {
    if (!user) return;
    api.get('/api/notificaciones/no-leidas')
      .then(r => setUnreadCount(r.data?.total || 0))
      .catch(() => {});
  };

  const loadNotifsList = () => {
    if (!user) return;
    api.get('/api/notificaciones')
      .then(r => setNotifs(r.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (showNotifs) loadNotifsList();
  }, [showNotifs]);

  const marcarLeida = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}/leer`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifs(prev => prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n));
    } catch {}
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/api/notificaciones/leer-todas');
      setUnreadCount(0);
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    } catch {}
  };

  const eliminarNotif = async (id) => {
    try {
      await api.delete(`/api/notificaciones/${id}`);
      setNotifs(prev => prev.filter(n => n.id_notificacion !== id));
      if (!notifs.find(n => n.id_notificacion === id)?.leida) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const isAdmin = user?.rol === 'administrador';
  const isVet = user?.rol === 'veterinario';
  const isRecep = user?.rol === 'recepcionista';

  const links = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/admin/personal', label: 'Personal', icon: 'users' },
        { to: '/admin/usuarios', label: 'Usuarios', icon: 'user' },
        { to: '/admin/bloc', label: 'Bloc', icon: 'book' },
        { to: '/admin/inventario', label: 'Inventario', icon: 'clipboard' },
        { to: '/reporte-vista', label: 'Reportes', icon: 'chart' },
        { to: '/perfil', label: 'Mi Perfil', icon: 'settings' },
      ]
    : isVet
    ? [
        { to: '/veterinario/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/veterinario/mis-citas', label: 'Mis Citas', icon: 'calendar' },
        { to: '/veterinario/historial', label: 'Pacientes', icon: 'paw' },
        { to: '/veterinario/medicamentos', label: 'Medicamentos', icon: 'clipboard' },
        { to: '/clientes', label: 'Clientes', icon: 'users' },
        { to: '/mascotas', label: 'Mascotas', icon: 'paw' },
        { to: '/perfil', label: 'Mi Perfil', icon: 'user' },
      ]
    : isRecep
    ? [
        { to: '/recepcion/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/recepcion/nueva-cita', label: 'Nueva Cita', icon: 'plus' },
        { to: '/recepcion/clientes', label: 'Clientes', icon: 'users' },
        { to: '/recepcion/mascotas', label: 'Mascotas', icon: 'paw' },
        { to: '/recepcion/facturas', label: 'Facturas', icon: 'document' },
        { to: '/perfil', label: 'Mi Perfil', icon: 'user' },
      ]
    : [
        { to: '/usuario/dashboard', label: 'Mis Citas', icon: 'calendar' },
        { to: '/usuario/nueva-cita', label: 'Nueva Cita', icon: 'plus' },
        { to: '/usuario/mis-mascotas', label: 'Mis Mascotas', icon: 'paw' },
        { to: '/usuario/mis-facturas', label: 'Mis Facturas', icon: 'document' },
        { to: '/perfil', label: 'Mi Perfil', icon: 'user' },
      ];

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-content">
        <Link to="/inicio" className="navbar-logo">
          <img src="/images/logo.png" alt="Vet Manager" />
          <span>{isAdmin ? 'Vet-Manager Admin' : isVet ? 'Vet-Manager Vet' : isRecep ? 'Vet-Manager Recepcion' : 'Vet-Manager'}</span>
        </Link>
        <div className="navbar-right">
          {user && (
            <>
              <div className="notif-bell-container" ref={notifRef}>
                <button className="notif-bell-btn" onClick={() => setShowNotifs(!showNotifs)}>
                  <Icon name="bell" size={20} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                {showNotifs && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <h4>Notificaciones</h4>
                      {unreadCount > 0 && (
                        <button className="notif-mark-all" onClick={marcarTodasLeidas}>Marcar todas leidas</button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifs.length === 0 ? (
                        <p className="notif-empty">No hay notificaciones</p>
                      ) : notifs.map(n => (
                        <div key={n.id_notificacion} className={`notif-item ${n.leida ? '' : 'notif-unread'}`}>
                          <div className="notif-content">
                            <strong className="notif-titulo">{n.titulo}</strong>
                            <p className="notif-mensaje">{n.mensaje}</p>
                            <span className="notif-fecha">{n.fecha}</span>
                          </div>
                          <div className="notif-actions">
                            {!n.leida && (
                              <button onClick={() => marcarLeida(n.id_notificacion)} title="Marcar como leida">
                                <Icon name="check" size={14} />
                              </button>
                            )}
                            <button onClick={() => eliminarNotif(n.id_notificacion)} title="Eliminar">
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="navbar-user">
                <span className="user-name">{user.nombre} {user.apellido}</span>
                <span className="user-role">{user.rol}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Cerrar Sesion
                </button>
              </div>
            </>
          )}
          <button
            className={`navbar-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
        {menuOpen && (
          <div className="navbar-menu-panel">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              >
                <span className="nav-link-icon"><Icon name={link.icon} size={16} /></span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
