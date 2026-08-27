import React, { useState } from 'react';
import Modal from '../../components/Modal';
import LoginModal from '../../components/LoginModal';
import RecuperarPasswordModal from '../../components/RecuperarPasswordModal';
import CONTACTO from '../../config/contacto';

const RecepcionLanding = () => {
  const [modal, setModal] = useState(null);

  const openLogin = () => setModal('login');
  const closeModal = () => setModal(null);

  return (
    <div className="landing-page landing-admin">
      <header className="landing-header">
        <div className="landing-header-inner">
          <img src="/images/logo.png" alt={`${CONTACTO.nombre} Recepcion`} className="header-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="header-brand">{CONTACTO.nombre} <em className="header-brand-tag">Recepcion</em></span>
          <nav className="header-nav">
            <button onClick={openLogin} className="header-btn-primary">Iniciar Sesion</button>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <h1>{CONTACTO.nombre} <span className="hero-admin-suffix">Recepcion</span></h1>
            <p className="hero-tagline">Gestiona citas, clientes y facturacion de la clinica de forma rapida y sencilla.</p>
            <div className="landing-hero-buttons">
              <button onClick={openLogin} className="btn-hero-primary">Iniciar Sesion</button>
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
          <h2>Herramientas para recepcion</h2>
          <p className="features-sub">Administra las citas y clientes de la clinica desde un solo lugar.</p>
          <div className="features-grid">
            {[
              { icon: '📅', title: 'Agendar Citas', desc: 'Registra citas para clientes y asigna veterinarios disponibles.' },
              { icon: '👥', title: 'Gestionar Clientes', desc: 'Registra clientes walk-in y administra su informacion.' },
              { icon: '🐾', title: 'Registrar Mascotas', desc: 'Agrega mascotas nuevas y asocialas a sus dueños.' },
              { icon: '💰', title: 'Facturacion', desc: 'Genera facturas para los servicios prestados.' },
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
            <h4>Contacto</h4>
            <a href={`https://wa.me/${CONTACTO.telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="footer-link">Chat por WhatsApp</a>
          </div>
          <div className="footer-col">
            <h4>Acerca de</h4>
            <p className="footer-text">{CONTACTO.nombre} Recepcion - Portal para el personal de recepcion.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {CONTACTO.anio} {CONTACTO.nombre}. Todos los derechos reservados.</p>
        </div>
      </footer>

      <Modal isOpen={modal === 'login'} onClose={closeModal}>
        <LoginModal allowedRoles={['recepcionista']} onClose={closeModal} onOpenRecuperar={() => setModal('recuperar')} />
      </Modal>
      <Modal isOpen={modal === 'recuperar'} onClose={closeModal}>
        <RecuperarPasswordModal onClose={closeModal} onOpenLogin={() => setModal('login')} />
      </Modal>
    </div>
  );
};

export default RecepcionLanding;
