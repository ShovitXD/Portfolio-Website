import React, { useEffect, useRef, useState } from 'react';
import HeaderGlass from './HeaderGlass';
import './header-glass.css';

const links = [ ['about', 'About me'], ['experience', 'Experience'], ['toolkit', 'Toolkit'], ['education', 'Education'] ];
export default function RubberHeader() {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const [scrollingDown, setScrollingDown] = useState(false);
  const [raised, setRaised] = useState(false);
  const header = useRef(null);
  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - previousY) > 3) setScrollingDown(y > previousY && y > 60);
      previousY = y;
      setRaised(y > 12);
      const threshold = (header.current?.offsetHeight || 100) + 90;
      let current = 0;
      links.forEach(([id], index) => {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= threshold) current = index;
      });
      if (y > 100 && y + window.innerHeight >= document.documentElement.scrollHeight - 8) current = 3;
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);
  const lifted = hovered ?? focused ?? active;
  return <header ref={header} className={`header rubber-header ${raised ? 'is-raised' : ''} ${scrollingDown ? 'is-sliding' : ''}`}>
    <HeaderGlass />
    <a className="brand" href="#home" aria-label="Shovit Naik home">sn<span>.</span></a>
    <nav className="rubber-nav" aria-label="Main navigation" onMouseLeave={() => setHovered(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null); }}>
      <span className={`nav-lift ${lifted !== null ? 'is-visible' : ''}`} style={{ '--nav-index': lifted ?? 0 }} aria-hidden="true"><canvas className="nav-glass-surface" /></span>
      {links.map(([id, label], index) => <a key={id} href={`#${id}`} className={lifted === index ? 'is-lifted' : ''} aria-current={active === index ? 'location' : undefined} onMouseEnter={() => setHovered(index)} onFocus={() => setFocused(index)} onClick={() => setActive(index)}>{label}</a>)}
    </nav>
    <div className="header-role"><span className="role-emblem" aria-hidden="true">◈</span><span>GAME<span>DEVELOPER</span></span></div>
  </header>;
}


