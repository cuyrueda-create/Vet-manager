import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import mascotaImg from '../assets/images/perroygato.jpeg'; // <--- Importa la imagen

const Dashboard = () => {
  const { user } = useAuth();

  // Determinar el texto del rol
  const getRolTexto = () => {
    if (user?.rol === 'admin') return 'Administrador';
    if (user?.rol === 'veterinario') return 'Veterinario';
    return 'Usuario';
  };

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>¡Bienvenido, {user?.nombre}! 👋</h1>
          <p>Rol: {getRolTexto()}</p>
          <p>Sistema de Gestión Veterinaria</p>
        </div>
        
        {/* Imagen de perro y gato */}
        <div className="mascota-decorativa">
          <img src={mascotaImg} alt="Perro y Gato - Mejores amigos" />
        </div>
        
        <div className="cards-container">
          <div className="card">
            <h3>📋 Listado mediante Vista SQL</h3>
            <p>Consulta datos organizados a través de una vista de base de datos. Ideal para informes rápidos y consultas predefinidas.</p>
            <Link to="/listado-vista" className="btn-primary">
              Ver listado →
            </Link>
          </div>
          
          <div className="card">
            <h3>⚙️ Listado mediante Procedimiento</h3>
            <p>Consulta datos usando un procedimiento almacenado con validación de condiciones. Mayor seguridad y lógica de negocio.</p>
            <Link to="/listado-procedimiento" className="btn-primary">
              Ver listado →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;