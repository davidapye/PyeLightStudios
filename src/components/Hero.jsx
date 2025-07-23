import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="relative h-screen text-white text-center flex items-center justify-center overflow-hidden font-display">
      <div className="absolute inset-0 z-0">
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
            <img src="/images/IMG_0109.jpg" alt="Slide 1" className="w-full h-screen object-cover" />
          </div>
          <div>
            <img src="/images/TrentLindsayLake.jpg" alt="Slide 2" className="w-full h-screen object-cover" />
          </div>
          <div>
            <img src="/images/KatieByWater.jpg" alt="Slide 3" className="w-full h-screen object-cover object-[25%_center]" />
          </div>
          <div>
            <img src="/images/TrentLindsayKiss.jpg" alt="Slide 4" className="w-full h-screen object-cover" />
          </div>
          <div>
            <img src="/images/JayAndKen.jpg" alt="Slide 5" className="w-full h-screen object-cover" />
          </div>
        </Carousel>
      </div>

      {/* Text Overlay */}
      <div className="relative z-10 px-4 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          Capturing every moment,<br className="hidden sm:block" /> big or small.
        </h1>

        <div className="mb-6">
        <p className="text-2xl sm:text-3xl font-semibold drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          <span className="text-white line-through mr-3 font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">$200</span>
          <span className="text-white font-extrabold text-4xl font-sans drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">$60</span>
        </p>
        <p className="text-xl sm:text-2xl font-light text-white mt-1 font-sans tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
          for a <span className="font-medium">45-minute shoot</span>
        </p>
      </div>


        <Link
          to="/book"
          className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition duration-200"
        >
          Contact Me
        </Link>
      </div>
    </section>
  );
}

export default Hero;
