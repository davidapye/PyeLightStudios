import React from 'react';
import './Photoshoots.css';

export default function Photoshoots() {
  const photos = [
    { id: 2, src: '/images/IMG_0096.jpg', alt: 'Family Session' },
    { id: 1, src: '/images/IMG_0012.jpg', alt: 'Maternity Shoot' },
    { id: 3, src: '/images/IMG_0128.jpg', alt: 'Newborn Session' },
    { id: 6, src: '/images/IMG_1569.jpg', alt: 'Event Coverage' },
    { id: 9, src: '/images/IMG_2652.jpg', alt: 'Event Coverage' },
    { id: 8, src: '/images/IMG_2741.jpg', alt: 'Event Coverage' },
    { id: 7, src: '/images/IMG_0399.jpg', alt: 'Event Coverage' },
    { id: 11, src: '/images/IMG_0580.jpg', alt: 'Event Coverage' },
    { id: 13, src: '/images/IMG_0456.jpg', alt: 'Event Coverage' },
    { id: 4, src: '/images/IMG_0938.jpg', alt: 'Couple Shoot' },
    { id: 10, src: '/images/IMG_0850.jpg', alt: 'Event Coverage' },
    { id: 5, src: '/images/IMG_0999.jpg', alt: 'Senior Portrait' },
    
  ];

  return (
    <div className="portfolio-container">
      <h1>Portfolio</h1>
      <div className="photo-grid">
        {photos.map(photo => (
          <div key={photo.id} className="photo-card">
            <img src={photo.src} alt={photo.alt}  style={
          photo.id === 7 
            ? { objectPosition: '70% center' } 
            : {}
        } />
          </div>
        ))}
      </div>
    </div>
  );
}
