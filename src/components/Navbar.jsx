import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setIsOpen(false), [location.pathname]);
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <div className="nav-container">
          <Link className="logo" to="/" aria-label="Pye Light Studios home">PYE LIGHT <span>STUDIOS</span></Link>
          <div id="primary-navigation" className={`nav-links ${isOpen ? 'open' : ''}`}>
            <Link to="/">Home</Link><Link to="/photoshoots">Portfolio</Link><Link to="/book">Contact</Link>
          </div>
          <Link className="nav-book" to="/book">Book a session</Link>
          <button className={`menu-toggle${isOpen ? ' open' : ''}`} type="button" aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen} aria-controls="primary-navigation" onClick={() => setIsOpen(!isOpen)}>
            <span aria-hidden="true"></span><span aria-hidden="true"></span>
          </button>
        </div>
      </nav>
    </header>
  );
}
