import React, { useState } from 'react';
import Modal from '../components/Modal';
import LoginModal from '../components/LoginModal';
import RegisterAdminModal from '../components/RegisterAdminModal';
import RecuperarPasswordModal from '../components/RecuperarPasswordModal';
import CONTACTO from '../config/contacto';

const AdminLanding = () => {
  const [modal, setModal] = useState(null);

  const openLogin = () => setModal('login');
  const openAdminRegister = () => setModal('admin');
  const closeModal = () => setModal(null);

  return (
    <div className="landing-page landing-admin">
      <header className="landing-header">
        <div className="landing-header-inner">
          <img src="/images/logo.png" alt={`${CONTACTO.nombre} Administrador`} className="header-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="header-brand">{CONTACTO.nombre} <em className="header-brand-tag">Administrador</em></span>
          <nav className="header-nav">
            <button onClick={openLogin} className="header-btn-outline">Iniciar Sesión</button>
            <button onClick={openAdminRegister} className="header-btn-primary">Solicitar Acceso</button>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <h1>{CONTACTO.nombre} <span className="hero-admin-suffix">Administrador</span></h1>
            <p className="hero-tagline">Registra tu clínica, estética o tienda de mascotas y gestiona tu negocio con herramientas profesionales.</p>
            <div className="landing-hero-buttons">
              <button onClick={openAdminRegister} className="btn-hero-primary">Registrar mi negocio</button>
              <button onClick={openLogin} className="btn-hero-secondary">Iniciar Sesión</button>
            </div>
          </div>
          <div className="landing-hero-image">
            <div className="hero-img-wrap">
              <img src="/images/perro.png" alt="Mascota" className="hero-pet-img"
                onError={e => { e.target.style.display = 'none'; e.target.parentNode.classList.add('img-failed'); }}
              />
              <span className="hero-fallback-emojis">🐶</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-features-inner">
          <h2>Todo lo que necesita tu negocio</h2>
          <p className="features-sub">Controla tu clínica de forma inteligente con herramientas todo-en-uno para tu equipo.</p>
          <div className="features-grid">
            {[
              { icon: '📅', title: 'Agenda de Citas', desc: 'Organiza y programa citas de forma sencilla con recordatorios automáticos.' },
              { icon: '🐾', title: 'Gestión de Pacientes', desc: 'Historial clínico completo de cada mascota con diagnósticos y tratamientos.' },
              { icon: '👥', title: 'Control de Empleados', desc: 'Crea usuarios para tu equipo: veterinarios y asistentes con sus roles.' },
              { icon: '📊', title: 'Reportes y Estadísticas', desc: 'Visualiza el rendimiento de tu negocio con reportes detallados.' },
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
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo-wrap">
              <img src="/images/logo.png" alt={`${CONTACTO.nombre} Administrador`} className="footer-logo"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <h4 className="footer-brand-name">{CONTACTO.nombre} Administrador</h4>
            <p className="footer-desc">Portal para clínicas veterinarias, estéticas y tiendas de mascotas.</p>
          </div>

          <div className="footer-col">
            <h4>Contacto</h4>
            <a href={`https://wa.me/${CONTACTO.telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="footer-link">💬 Chat por WhatsApp</a>
            <div className="footer-schedule">
              <p>🕐 Lun - Vie: 8:00 - 18:00</p>
              <p>🕐 Sáb: 8:00 - 14:00</p>
            </div>
          </div>

          <div className="footer-col">
            <h4>Enlaces</h4>
            <button onClick={openLogin} className="footer-link-btn">Iniciar Sesión</button>
            <button onClick={openAdminRegister} className="footer-link-btn">Solicitar Acceso</button>
          </div>

          <div className="footer-col">
            <h4>Acerca de</h4>
            <p className="footer-text">{CONTACTO.nombre} Administrador es el módulo de gestión para clínicas, estéticas y tiendas de mascotas.</p>
            <h4 className="footer-social-title">Redes Sociales</h4>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">📘</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">📸</a>
              <a href="https://wa.me/${CONTACTO.telefono.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" className="social-link" title="WhatsApp">💬</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {CONTACTO.anio} {CONTACTO.nombre}. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={modal === 'login'} onClose={closeModal}>
        <LoginModal allowedRoles={['admin', 'veterinario', 'asistente']} onClose={closeModal} onOpenRegister={() => setModal('admin')} onOpenRecuperar={() => setModal('recuperar')} />
      </Modal>
      <Modal isOpen={modal === 'admin'} onClose={closeModal}>
        <RegisterAdminModal onClose={closeModal} onOpenLogin={() => setModal('login')} />
      </Modal>
      <Modal isOpen={modal === 'recuperar'} onClose={closeModal}>
        <RecuperarPasswordModal onClose={closeModal} onOpenLogin={() => setModal('login')} />
      </Modal>
    </div>
  );
};

export default AdminLanding;