import React from 'react';
import './About.css';

function About() {
  return (
    <section className="about">
      <div className="about-content">
        <img src="./images/BehindLens.jpg" alt="Photographer behind lens" />
        <div>
          <h2>Behind the Lens</h2>
          <p>Hi, I’m David — a software engineer turned photographer, driven by a passion for capturing life’s most meaningful moments. From the excitement of a first home to the quiet magic of a newborn's first days, I’m here to preserve the moments that matter most.</p>
        </div>
      </div>
    </section>
  );
}
export default About;
