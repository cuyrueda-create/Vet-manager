import React, { useState } from 'react';
import Modal from '../components/Modal';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import RecuperarPasswordModal from '../components/RecuperarPasswordModal';
import CONTACTO from '../config/contacto';

const Inicio = () => {
  const [modal, setModal] = useState(null);

  const openLogin = () => setModal('login');
  const openRegister = () => setModal('register');
  const closeModal = () => setModal(null);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner">
          <img src="/images/logo.png" alt={CONTACTO.nombre} className="header-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <span className="header-brand">{CONTACTO.nombre}</span>
          <nav className="header-nav">
            <button onClick={openLogin} className="header-btn-outline">Iniciar Sesión</button>
            <button onClick={openRegister} className="header-btn-primary">Registrarse</button>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <h1>{CONTACTO.nombre}</h1>
            <p className="hero-tagline">Software profesional para clínicas veterinarias, estéticas y tiendas de mascotas.</p>
            <div className="landing-hero-buttons">
              <button onClick={openRegister} className="btn-hero-primary">Comenzar ahora</button>
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
          <h2>Todo lo que necesitas para tu clínica</h2>
          <p className="features-sub">Gestiona tu clínica de forma inteligente con nuestras herramientas todo-en-uno.</p>
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
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo-wrap">
              <img src="/images/logo.png" alt={CONTACTO.nombre} className="footer-logo"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <h4 className="footer-brand-name">{CONTACTO.nombre}</h4>
            <p className="footer-desc">Software profesional para clínicas veterinarias, estéticas y tiendas de mascotas.</p>
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
            <h4>Portales</h4>
            <a href="/admin" className="footer-link-btn" style={{ display: 'block', marginBottom: 4 }}>Portal Administrador</a>
            <a href="/recepcion" className="footer-link-btn" style={{ display: 'block', marginBottom: 4 }}>Portal Recepcion</a>
            <button onClick={openLogin} className="footer-link-btn">Iniciar Sesion Cliente</button>
          </div>

          <div className="footer-col">
            <h4>Acerca de</h4>
            <p className="footer-text">{CONTACTO.nombre} es un sistema de gestión veterinaria diseñado para facilitar la administración de clínicas, estéticas y tiendas de mascotas.</p>
            <button onClick={() => setModal('terminos')} className="footer-link-btn" style={{ fontSize: 12 }}>Terminos</button>
            <button onClick={() => setModal('privacidad')} className="footer-link-btn" style={{ fontSize: 12 }}>Privacidad</button>
            <button onClick={() => setModal('datos')} className="footer-link-btn" style={{ fontSize: 12 }}>Eliminacion de Datos</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {CONTACTO.anio} {CONTACTO.nombre}. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Modals */}
      <Modal isOpen={modal === 'login'} onClose={closeModal}>
        <LoginModal allowedRoles={['usuario']} onClose={closeModal} onOpenRegister={() => setModal('register')} onOpenRecuperar={() => setModal('recuperar')} />
      </Modal>
      <Modal isOpen={modal === 'register'} onClose={closeModal}>
        <RegisterModal onClose={closeModal} onOpenLogin={() => setModal('login')} />
      </Modal>
      <Modal isOpen={modal === 'recuperar'} onClose={closeModal}>
        <RecuperarPasswordModal onClose={closeModal} onOpenLogin={() => setModal('login')} />
      </Modal>

      {/* Modals legales */}
      <Modal isOpen={modal === 'terminos'} onClose={closeModal}>
        <div className="legal-modal">
          <h2>Términos de Servicio</h2>
          <div className="legal-content">
            <p>Al utilizar {CONTACTO.nombre}, aceptas los siguientes términos y condiciones:</p>
            <ol>
              <li><strong>Uso del sistema:</strong> El sistema de gestión veterinaria está diseñado exclusivamente para uso administrativo y clínico dentro de la entidad registrada. El acceso no autorizado está prohibido.</li>
              <li><strong>Privacidad de datos:</strong> Toda la información de pacientes, clientes y personal médico es confidencial y será tratada conforme a la legislación vigente de protección de datos personales.</li>
              <li><strong>Responsabilidad del usuario:</strong> Cada usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
              <li><strong>Registro de información:</strong> Los datos ingresados en el sistema deben ser verídicos y precisos.</li>
              <li><strong>Disponibilidad del servicio:</strong> Se realizarán esfuerzos razonables para mantener el sistema operativo, pero no se garantiza disponibilidad ininterrumpida.</li>
              <li><strong>Modificaciones:</strong> Nos reservamos el derecho de actualizar estos términos en cualquier momento.</li>
            </ol>
          </div>
        </div>
      </Modal>
      <Modal isOpen={modal === 'privacidad'} onClose={closeModal}>
        <div className="legal-modal">
          <h2>Aviso de Privacidad</h2>
          <div className="legal-content">
            <p>En {CONTACTO.nombre}, nos comprometemos a proteger tu privacidad. Este aviso explica cómo recopilamos, usamos y protegemos tu información personal.</p>
            <ol>
              <li><strong>Información recopilada:</strong> Recopilamos datos como nombre, correo electrónico, teléfono y dirección necesarios para la prestación de nuestros servicios.</li>
              <li><strong>Uso de la información:</strong> Tus datos se utilizan únicamente para la gestión de servicios veterinarios, facturación y comunicación relacionada con el servicio.</li>
              <li><strong>Protección de datos:</strong> Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado.</li>
              <li><strong>Derechos del usuario:</strong> Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos en cualquier momento.</li>
              <li><strong>Compartir información:</strong> No compartimos tus datos personales con terceros sin tu consentimiento explícito, excepto cuando sea requerido por ley.</li>
            </ol>
          </div>
        </div>
      </Modal>
      <Modal isOpen={modal === 'datos'} onClose={closeModal}>
        <div className="legal-modal">
          <h2>Eliminación de Datos</h2>
          <div className="legal-content">
            <p>Puedes solicitar la eliminación de tus datos personales de nuestros sistemas en cualquier momento.</p>
            <ol>
              <li><strong>Solicitud:</strong> Para solicitar la eliminación de tus datos, envía un correo a <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a> con el asunto "Eliminación de datos".</li>
              <li><strong>Proceso:</strong> Procesaremos tu solicitud en un plazo máximo de 15 días hábiles.</li>
              <li><strong>Confirmación:</strong> Recibirás un correo de confirmación una vez que tus datos hayan sido eliminados.</li>
              <li><strong>Excepciones:</strong> Podremos retener cierta información cuando sea requerido por obligaciones legales o regulatorias.</li>
            </ol>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inicio;
