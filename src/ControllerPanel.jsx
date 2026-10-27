import React, { useRef, useState, useEffect } from 'react';
import { angularDelta, pushBall } from './ballCollision';
import useLiquidGlass from './useLiquidGlass';
import './liquid-glass.css';

const directions = [ ['up', '↑', 0, -1], ['right', '→', 1, 0], ['down', '↓', 0, 1], ['left', '←', -1, 0] ];
export default function ControllerPanel() {
  const arena = useRef(null);
  const timer = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(null);
  const [angles, setAngles] = useState([220, 35]);
  useLiquidGlass(arena, angles, `${wireframe}:${stick.x}:${stick.y}:${pressed}`);
  useEffect(() => () => clearTimeout(timer.current), []);
  function reset() { setDragging(false); setStick({ x: 0, y: 0 }); setPressed(null); }
  function nudge(name, x, y) {
    clearTimeout(timer.current);
    setPressed(name); setStick({ x: x * 20, y: y * 20 });
    timer.current = setTimeout(reset, 240);
  }
  function moveStick(event) {
    const rect = arena.current.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / rect.width * 100;
    let y = (event.clientY - rect.top - rect.height / 2) / rect.height * 100;
    const distance = Math.hypot(x, y);
    if (distance > 8) { x *= 8 / distance; y *= 8 / distance; }
    setStick({ x: x * 3, y: y * 3 });
  }
  function moveBall(event, index) {
    const rect = arena.current.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2) * 180 / Math.PI;
    setAngles(current => pushBall(current, index, angularDelta(current[index], angle)));
  }
  return <div className="playground controller-panel">

    <div className="controller-arena" ref={arena}>
      <div className="rubber-track"/><div className="rubber-inner"/>
      <div className="direction-pad">{directions.map(([name, symbol, x, y]) => <button key={name} className={`rubber-arrow arrow-${name} ${pressed === name ? 'is-pressed' : ''}`} aria-label={`Push ${name}`} onClick={() => nudge(name, x, y)}><span>{symbol}</span></button>)}</div>
      <div className="joystick-socket"><div className="joystick-stem" style={{ transform: `translate(${stick.x * .35}px, ${stick.y * .35}px)` }}/><button className={`joystick-cap ${wireframe ? 'is-wireframe' : ''} ${dragging ? 'is-dragging' : ''}`} style={{ '--stick-x': `${stick.x}px`, '--stick-y': `${stick.y}px`, '--tilt-x': `${-stick.y * .4}deg`, '--tilt-y': `${stick.x * .4}deg` }} aria-label="Drag joystick or use arrow keys" onPointerDown={event => { clearTimeout(timer.current); event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); moveStick(event); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveStick(event); }} onPointerUp={event => { event.currentTarget.releasePointerCapture(event.pointerId); reset(); }} onPointerCancel={reset} onLostPointerCapture={reset} onKeyDown={event => { const direction = directions.find(([name]) => event.key === `Arrow${name[0].toUpperCase()}${name.slice(1)}`); if (direction) { event.preventDefault(); nudge(direction[0], direction[2], direction[3]); } }}><span className="joystick-grip"/><span className="joystick-center">+</span></button></div>
      {angles.map((angle, index) => <button key={index} className={`track-ball ball-${index}`} style={{ left: `${50 + Math.cos(angle * Math.PI / 180) * 43}%`, top: `${50 + Math.sin(angle * Math.PI / 180) * 43}%` }} aria-label={`Drag ${index === 0 ? 'orange' : 'blue'} ball around the groove, or use arrow keys`} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); moveBall(event, index); }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveBall(event, index); }} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); const step = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -8 : 8; setAngles(current => pushBall(current, index, step)); } }}><canvas aria-hidden="true" /></button>) }
    </div>

    <div className="scene-bottom"><button className="view-toggle" onClick={() => setWireframe(!wireframe)} aria-pressed={wireframe} aria-label="Toggle joystick wireframe">{wireframe ? '◈ Solid view' : '◇ Wireframe'}</button></div>
  </div>;
}


