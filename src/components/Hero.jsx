import React from 'react';
import './Hero.css';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="hero">
      <div className="carousel-wrapper">
        <Carousel 
          autoPlay 
          infiniteLoop 
          showThumbs={false} 
          showStatus={false} 
          interval={4000} 
          showArrows={false}
          swipeable={false}
          stopOnHover={false}
        >
          <div>
            <img src="/images/IMG_0109.jpg" alt="Slide 1" />
          </div>
          <div>
            <img src="/images/JayAndKen.jpg" alt="Slide 2" />
          </div>
          <div>
            <img src="/images/KatieByWater.jpg" alt="Slide 3" style={{ objectPosition: '25% center' }}/>
          </div>
        </Carousel>
      </div>

      <div className="hero-text">
        <h1>Capturing every moment, no matter how big or how small.</h1>
        <h2>New Clients get 70% off.</h2>
        <Link to="/book" className="hero-button">Contact Me</Link>
      </div>
    </section>
  );
}

export default Hero;
