import React, { useLayoutEffect, useRef, useState } from 'react';
const categories = ['All', 'Code', 'Engines', 'Art & design'];
export default function SkillFilters({ value, onChange }) {
  const container = useRef(null);
  const [position, setPosition] = useState(null);
  useLayoutEffect(() => {
    const element = container.current;
    const measure = () => {
      const selected = element.querySelector('[aria-pressed="true"]');
      if (selected) setPosition({ x: selected.offsetLeft, width: selected.offsetWidth, height: selected.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const button of element.querySelectorAll('button')) observer.observe(button);
    return () => observer.disconnect();
  }, [value]);
  return <div ref={container} className="filters sliding-filters" aria-label="Filter skills">
    <span className="filter-dent" aria-hidden="true" style={position ? { transform: `translateX(${position.x}px)`, width: position.width, height: position.height, opacity: 1 } : { opacity: 0 }}/>
    {categories.map(item => <button key={item} className={value === item ? 'active' : ''} aria-pressed={value === item} onClick={() => onChange(item)}>{item}</button>)}
  </div>;
}
