import React from 'react';
import './Photoshoots.css';
import { getResponsiveImageProps } from '../utils/responsiveImages';

export default function Photoshoots() {
  const photos = [
    { id: 1, src: '/images/IMG_0096.webp', alt: 'Family Session' },
    { id: 2, src: '/images/IMG_0012.webp', alt: 'Maternity Shoot' },
    { id: 3, src: '/images/IMG_0128.webp', alt: 'Newborn Session' },
    { id: 4, src: '/images/IMG_1569.webp', alt: 'A joyful family gathering outdoors' },
    { id: 5, src: '/images/IMG_2652.webp', alt: 'A couple sharing a candid moment' },
    { id: 6, src: '/images/IMG_2741.webp', alt: 'Family portrait in warm evening light' },
    { id: 7, src: '/images/IMG_0399.webp', alt: 'Portrait session among the trees' },
    { id: 8, src: '/images/IMG_0580.webp', alt: 'Newborn held close by a parent' },
    { id: 9, src: '/images/IMG_0456.webp', alt: 'A relaxed portrait in natural light' },
    { id: 10, src: '/images/IMG_4177.webp', alt: 'Family walking together outside' },
    { id: 11, src: '/images/IMG_4758.webp', alt: 'A couple laughing during their session' },
    { id: 12, src: '/images/IMG_4840.webp', alt: 'A quiet family moment captured at home' },
    { id: 13, src: '/images/IMG_0938.webp', alt: 'Couple Shoot' },
    { id: 14, src: '/images/IMG_0850.webp', alt: 'Portrait of a family outdoors' },
    { id: 15, src: '/images/IMG_0999.webp', alt: 'Senior Portrait' },
    
  ];

  return (
    <div className="portfolio-container">
      <p className="eyebrow eyebrow-dark">A COLLECTION OF REAL MOMENTS</p>
      <h1>Stories, held in light.</h1>
      <div className="photo-grid">
        {photos.map(photo => (
          <div key={photo.id} className="photo-card">
          <img {...getResponsiveImageProps(photo.src, '(max-width: 760px) 50vw, 33vw')} alt={photo.alt} loading="lazy" decoding="async" style={
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
