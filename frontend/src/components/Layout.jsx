import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="layout-logo">
        <Link to="/">
          <img src="/images/logo.png" alt="Vet Manager" />
        </Link>
      </div>
      {children}
    </div>
  );
};

export default Layout;
