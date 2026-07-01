import React from 'react';
import { Link } from 'react-router-dom';
import CONTACTO from '../config/contacto';

const Inicio = () => {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link to="/" className="landing-logo">
            <img src="/images/logo.png" alt={CONTACTO.nombre} />
            <span>{CONTACTO.nombre}</span>
          </Link>
          <nav className="landing-nav-links">
            <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
            <Link to="/registro" className="btn-primary-nav">Registrarse</Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <h1>Bienvenido a <span>{CONTACTO.nombre}</span></h1>
            <p>Sistema de gestión veterinaria inteligente. Administra pacientes, citas, historiales clínicos y más, todo en un solo lugar.</p>
            <div className="landing-hero-buttons">
              <Link to="/registro" className="btn-hero-primary">Comenzar ahora</Link>
              <Link to="/login" className="btn-hero-secondary">Iniciar Sesión</Link>
            </div>
          </div>
          <div className="landing-hero-image">
            <div className="hero-pets">
              <div className="hero-img-wrap">
                <img src="/images/perro.png" alt="Mascota" className="hero-pet-img"
                  onError={e => { e.target.style.display = 'none'; e.target.parentNode.classList.add('img-failed'); }}
                />
                <span className="hero-fallback-emojis">🐶</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-features-inner">
          <h2>Todo lo que necesitas para tu clínica</h2>
          <div className="features-grid">
            {[
              { icon: '📅', title: 'Agenda de Citas', desc: 'Organiza y programa citas de forma sencilla con recordatorios automáticos.' },
              { icon: '🐾', title: 'Gestión de Pacientes', desc: 'Historial clínico completo de cada mascota con diagnósticos y tratamientos.' },
              { icon: '👥', title: 'Control de Clientes', desc: 'Administra la información de los dueños y su historial de servicios.' },
              { icon: '📊', title: 'Reportes y Estadísticas', desc: 'Visualiza el rendimiento de tu clínica con reportes detallados.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-brand">
            <h4>{CONTACTO.nombre}</h4>
            <p>Sistema de gestión veterinaria</p>
          </div>
          <div className="footer-contact">
            <p>📧 {CONTACTO.email}</p>
            <p>📱 {CONTACTO.telefono}</p>
            <p>📍 {CONTACTO.ubicacion}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {CONTACTO.anio} {CONTACTO.nombre}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Inicio;
