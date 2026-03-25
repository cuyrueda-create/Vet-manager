import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/VetManager_Logo_Solo.png';
import perro from '../assets/images/perro.png';

const Inicio = () => {
  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-nav">
          <Link to="/" className="logo">
            <img src={logo} alt="Vet Manager" />
            <span>Vet Manager</span>
          </Link>
          <div className="nav-buttons">
            <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
            <Link to="/registro" className="btn-primary">Registrarse</Link>
          </div>
        </div>
      </header>

      {/* Resto del contenido... */}
      <section className="hero">
        <div className="hero-content">
          <h1>Bienvenido a <span>Vet Manager</span></h1>
          <p>Cuidamos de tus mascotas como si fueran nuestras</p>
          <div className="hero-buttons">
            <Link to="/registro" className="btn-large">📅 Sacar Cita</Link>
            <Link to="/login" className="btn-outline-large">🔐 Iniciar Sesión</Link>
          </div>
        </div>
        <div className="hero-image">
          <img src={perro} alt="Perro feliz" />
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <h2>Nuestros Servicios</h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🐕</div>
            <h3>Consultas Veterinarias</h3>
            <p>Atención médica especializada para tu mascota</p>
          </div>
          <div className="service-card">
            <div className="service-icon">💉</div>
            <h3>Vacunación</h3>
            <p>Mantén a tu mascota protegida con nuestras vacunas</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🏥</div>
            <h3>Cirugías</h3>
            <p>Procedimientos quirúrgicos con los mejores especialistas</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🩺</div>
            <h3>Urgencias 24/7</h3>
            <p>Atención inmediata las 24 horas del día</p>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="why-us">
        <div className="why-content">
          <h2>¿Por qué elegir Vet Manager?</h2>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">✅</span>
              <p>Profesionales certificados</p>
            </div>
            <div className="feature">
              <span className="feature-icon">✅</span>
              <p>Instalaciones modernas y equipadas</p>
            </div>
            <div className="feature">
              <span className="feature-icon">✅</span>
              <p>Atención personalizada</p>
            </div>
            <div className="feature">
              <span className="feature-icon">✅</span>
              <p>Sistema de citas en línea</p>
            </div>
          </div>
          <Link to="/registro" className="btn-large">✨ ¡Regístrate y agenda tu cita!</Link>
        </div>
        <div className="why-image">
          <img src={logo} alt="Vet Manager" />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={logo} alt="Vet Manager" />
            <span>Vet Manager</span>
          </div>
          <div className="footer-links">
            <h4>Enlaces rápidos</h4>
            <Link to="/login">Iniciar Sesión</Link>
            <Link to="/registro">Registrarse</Link>
            <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
          </div>
          <div className="footer-contact">
            <h4>Contacto</h4>
            <p>📞 (123) 456-7890</p>
            <p>✉️ contacto@vetmanager.com</p>
            <p>📍 Av. Principal #123, Ciudad</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Vet Manager. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Inicio;