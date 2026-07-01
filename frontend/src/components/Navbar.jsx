import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/inicio', label: 'Inicio', icon: '🏠' },
    { to: '/clientes', label: 'Clientes', icon: '👥' },
    { to: '/mascotas', label: 'Mascotas', icon: '🐾' },
    { to: '/citas', label: 'Citas', icon: '📅' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/inicio" className="navbar-logo">
          <img src="/images/logo.png" alt="Vet Manager" />
          <span>Vet Manager</span>
        </Link>
        <div className="navbar-links">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="user-info">
              <span className="user-name">{user.nombre}</span>
              <button onClick={handleLogout} className="logout-btn">
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
