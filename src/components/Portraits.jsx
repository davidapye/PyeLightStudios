import React from 'react';
import { Link } from 'react-router-dom';
import './Portraits.css';

function Portraits() {
  return (
    <section className="portraits">
      {/* <h2>Portraits</h2> */}
      <div className="portrait-cards">
        <Link to="/photoshoots" className="card">Portfolio</Link>
        {/* <Link to="/realestate" className="card">Realestate</Link>
        <Link to="/moments" className="card">Magical Moments</Link> */}
      </div>
      <div className="portrait-cards">
        <Link to="/book" className="card">Contact Me</Link>
      </div>
    </section>
  );
}
export default Portraits;
