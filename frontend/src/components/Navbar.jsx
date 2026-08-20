import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.rol === 'admin';

  const links = isAdmin
    ? [
        { to: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
        { to: '/admin/citas', label: 'Citas', icon: 'calendar' },
        { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
        { to: '/clientes', label: 'Clientes', icon: 'users' },
        { to: '/mascotas', label: 'Mascotas', icon: 'paw' },
        { to: '/facturas', label: 'Facturas', icon: 'document' },
        { to: '/reporte-vista', label: 'Reporte', icon: 'chart' },
        { to: '/perfil', label: 'Mi Perfil', icon: 'user' },
      ]
    : [
        { to: '/usuario/dashboard', label: 'Mis Citas', icon: 'calendar' },
        { to: '/usuario/nueva-cita', label: 'Nueva Cita', icon: 'plus' },
        { to: '/clientes', label: 'Clientes', icon: 'users' },
        { to: '/mascotas', label: 'Mascotas', icon: 'paw' },
        { to: '/facturas', label: 'Facturas', icon: 'document' },
        { to: '/reporte-vista', label: 'Reporte', icon: 'chart' },
        { to: '/perfil', label: 'Mi Perfil', icon: 'user' },
      ];

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-content">
        <Link to="/inicio" className="navbar-logo">
          <img src="/images/logo.png" alt="Vet Manager" />
          <span>{isAdmin ? 'Vet-Manager Admin' : 'Vet-Manager'}</span>
        </Link>
        <div className="navbar-right">
          {user && (
            <div className="navbar-user">
              <span className="user-name">{user.nombre} {user.apellido}</span>
              <span className="user-role">{user.rol}</span>
              <button onClick={handleLogout} className="logout-btn">
                Cerrar Sesión
              </button>
            </div>
          )}
          <button
            className={`navbar-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
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