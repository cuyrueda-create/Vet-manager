import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/VetManager_Logo_Solo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const nombreCompleto = user ? `${user.nombre} ${user.apellido || ''}` : 'Usuario';

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-logo">
          <img src={logo} alt="Vet Manager" />
          <span>Vet Manager</span>
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard">Inicio</Link>
          <Link to="/listado-vista">Vista SQL</Link>
          <Link to="/listado-procedimiento">Procedimiento</Link>
          <div className="user-info">
            <span className="user-name">👋 {nombreCompleto}</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;