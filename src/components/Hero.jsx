import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getResponsiveImageProps } from '../utils/responsiveImages';

export default function Hero() {
  const storiesRailRef = useRef(null);
  const railDrag = useRef(null);
  const [visibleReveals, setVisibleReveals] = useState({});
  const stories = [
    { image: '/images/JayAndKen.webp', alt: 'A couple celebrating together', label: 'Together, always' },
    { image: '/images/KatieByWater.webp', alt: 'A portrait beside the water', label: 'By the water' },
    { image: '/images/MaternityDog.webp', alt: 'A maternity portrait with the family dog', label: 'A growing family' },
    { image: '/images/BehindLens.webp', alt: 'A quiet moment behind the camera', label: 'In the moment' },
    { image: '/images/TrentLindsayKiss.webp', alt: 'A couple sharing a kiss outdoors', label: 'A little closer' },
  ];

  React.useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('[data-scroll-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setVisibleReveals(Object.fromEntries(Array.from(targets, (_, index) => [index, true])));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      setVisibleReveals((current) => {
        const next = { ...current };
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            next[entry.target.dataset.revealId] = true;
            observer.unobserve(entry.target);
          }
        });
        return next;
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((target, index) => {
      target.dataset.revealId = index;
      observer.observe(target);
    });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const targets = document.querySelectorAll('[data-scroll-depth]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;
    const isTouchLayout = window.matchMedia('(max-width: 760px)').matches;
    let frame = null;
    let ticking = false;
    const update = () => {
      const viewportHeight = window.innerHeight;
      let stillMoving = false;
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewportHeight) return;
        const progress = Math.max(-0.5, Math.min(0.5, (viewportHeight - rect.top) / (viewportHeight + rect.height) - 0.5));
        const desired = progress * Number(target.dataset.scrollDepth) * (isTouchLayout ? 1.5 : 1);
        const current = Number(target.dataset.currentY || 0);
        const next = current + (desired - current) * 0.18;
        target.dataset.currentY = next;
        target.style.setProperty('--scroll-y', `${next.toFixed(2)}px`);
        if (Math.abs(desired - next) > 0.15) stillMoving = true;
      });
      if (stillMoving) frame = window.requestAnimationFrame(update);
      else { frame = null; ticking = false; }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        frame = window.requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  const revealProps = (id) => ({ 'data-scroll-reveal': '', className: `scroll-reveal${visibleReveals[id] ? ' is-visible' : ''}` });

  const startRailDrag = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    railDrag.current = { x: event.clientX, scrollLeft: storiesRailRef.current.scrollLeft };
    storiesRailRef.current.classList.add('is-dragging');
    storiesRailRef.current.setPointerCapture(event.pointerId);
  };

  const moveRailDrag = (event) => {
    if (!railDrag.current) return;
    const delta = event.clientX - railDrag.current.x;
    storiesRailRef.current.scrollLeft = railDrag.current.scrollLeft - delta;
  };

  const stopRailDrag = () => {
    railDrag.current = null;
    storiesRailRef.current?.classList.remove('is-dragging');
  };

  return <main className="home-page">
    <section className="hero" aria-labelledby="hero-title">
      <img className="hero-image" data-scroll-depth="24" src="/images/TrentLindsayLake.webp" alt="A couple sharing a quiet moment beside the lake" fetchPriority="high" />
      <div className="hero-shade" />
      <div className="hero-copy">
        <p className="eyebrow">PHOTOGRAPHY FOR THE MOMENTS THAT MATTER</p>
        <h1 id="hero-title">Keep the feeling.<br/><em>Keep the photograph.</em></h1>
        <p className="hero-description">Honest, artful portraits of the people and places you’ll want to remember.</p>
        <div className="hero-actions"><Link className="button button-light" to="/book">Book a 45-minute session</Link><Link className="text-link" to="/photoshoots">Explore the portfolio</Link></div>
      </div>
      <div className="hero-meta"><span>BASED IN GEORGIA</span><span>FAMILIES · COUPLES · LIFE</span></div>
    </section>
    <section className="intro-section">
      <div {...revealProps(0)}><p className="eyebrow eyebrow-dark">A LITTLE SPACE TO BE YOURSELF</p><h2>Beautiful photographs<br/>begin with <em>being present.</em></h2></div>
      <div className={`intro-detail scroll-reveal${visibleReveals[1] ? ' is-visible' : ''}`} data-scroll-reveal="" data-reveal-id="1"><p>No stiff poses. No pressure to perform. Just a thoughtful, easygoing session that makes room for the way your story really feels.</p><Link className="underlined-link" to="/photoshoots">See the work</Link></div>
    </section>
    <section className="stories-section" aria-labelledby="stories-title">
      <div className="stories-heading">
        <div {...revealProps(2)}><p className="eyebrow eyebrow-dark">A FEW STORIES, BEAUTIFULLY KEPT</p><h2 id="stories-title">Little moments.<br/><em>Big life.</em></h2></div>
      </div>
      <div className="stories-rail" ref={storiesRailRef} role="region" aria-label="Featured photography stories" tabIndex="0" onPointerDown={startRailDrag} onPointerMove={moveRailDrag} onPointerUp={stopRailDrag} onPointerCancel={stopRailDrag}>
        {stories.map((story, index) => <figure className={`story-card scroll-reveal${visibleReveals[3 + index] ? ' is-visible' : ''}`} key={story.image} data-scroll-reveal="" data-reveal-id={3 + index} style={{ '--reveal-delay': `${index * 70}ms` }}>
          <img {...getResponsiveImageProps(story.image, '(max-width: 760px) 78vw, 30vw')} alt={story.alt} loading="lazy" decoding="async" draggable="false" />
          <figcaption><span>{story.label}</span></figcaption>
        </figure>)}
      </div>
      <Link className="underlined-link stories-link" to="/photoshoots">View all photographs</Link>
    </section>
  </main>;
}
