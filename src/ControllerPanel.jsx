import React, { useEffect, useRef, useState } from 'react';
import { renderer } from './useLiquidGlass';
import { createGame, drawGame, stepGame } from './gravityEngine';
import './gravity-game.css';

export default function ControllerPanel() {
  const root = useRef(null), screen = useRef(null), canvas = useRef(null), glass = useRef(null), socket = useRef(null);
  const game = useRef(createGame()), input = useRef({ x: 0, y: 0, fire: false });
  const stickPointer = useRef(null), firePointer = useRef(null), keyFire = useRef(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false), [hud, setHud] = useState({ score: 0, status: 'ready' });
  const [paused, setPaused] = useState(false), [glassError, setGlassError] = useState(false);
  const syncFire = () => { input.current.fire = keyFire.current || firePointer.current !== null; setPressed(input.current.fire); };
  const releaseStick = () => { stickPointer.current = null; input.current.x = 0; input.current.y = 0; setStick({ x: 0, y: 0 }); };
  const releaseAll = () => { releaseStick(); keyFire.current = false; firePointer.current = null; syncFire(); };
  function start() {
    if (game.current.status === 'over') game.current = createGame(game.current.width, game.current.height);
    game.current.status = 'running'; setHud({ score: game.current.score, status: 'running' }); setPaused(false);
  }
  function moveStick(event) {
    const rect = socket.current.getBoundingClientRect(), radius = rect.width * 0.27;
    let x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
    const length = Math.hypot(x, y);
    if (length > radius) { x *= radius / length; y *= radius / length; }
    input.current.x = x / radius; input.current.y = y / radius; setStick({ x, y });
  }
  useEffect(() => {
    const panel = root.current, surface = screen.current, scene = canvas.current;
    const ctx = scene.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lens;
    try { lens = renderer(glass.current, 0); } catch (error) { console.warn('Gravity Escape glass renderer unavailable', error); }
    if (!lens) setGlassError(true);
    let frame, previous = 0, accumulator = 0, disposed = false, visible = true;
    function resize() {
      const bounds = surface.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!bounds.width || !bounds.height) return;
      const old = game.current, nextHeight = 480 * bounds.height / bounds.width, sy = nextHeight / old.height;
      for (const body of [old.player, ...old.meteors, ...old.bullets, ...old.fragments]) body.y *= sy;
      old.height = nextHeight; old.sun.y = nextHeight / 2;
      scene.width = Math.round(bounds.width * dpr); scene.height = Math.round(bounds.height * dpr);
      glass.current.style.width = `${old.sun.r * 2 / 480 * bounds.width}px`;
      glass.current.style.height = glass.current.style.width;
      if (old.status === 'running' && Math.hypot(old.player.x - old.sun.x, old.player.y - old.sun.y) <= old.sun.r + old.player.r + 8) {
        old.player.x = old.width * 0.25; old.player.y = old.height * 0.38; old.player.vx = old.player.vy = 0;
      }
    }
    const observer = new ResizeObserver(resize); observer.observe(surface); resize();
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) releaseAll(); }, { threshold: 0.2 }); intersection.observe(panel);
    function tick(now) {
      if (disposed) return;
      const active = !document.hidden && document.hasFocus() && visible && panel.contains(document.activeElement);
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0; previous = now;
      setPaused(current => { const next = game.current.status === 'running' && !active; return current === next ? current : next; });
      if (active) {
        accumulator += dt;
        while (accumulator >= 1 / 120) { stepGame(game.current, input.current, 1 / 120); accumulator -= 1 / 120; }
      } else accumulator = 0;
      const state = game.current;
      ctx.setTransform(scene.width / state.width, 0, 0, scene.height / state.height, 0, 0); drawGame(ctx, state, reducedMotion.matches ? 0 : now / 1000);
      if (lens) { lens.upload(scene); lens.draw(surface.getBoundingClientRect()); }
      setHud(current => current.score === state.score && current.status === state.status ? current : { score: state.score, status: state.status });
      frame = requestAnimationFrame(tick);
    }
    const typing = target => target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    function keydown(event) {
      if (event.code !== 'KeyF' || typing(event.target) || !panel.contains(document.activeElement) || document.hidden || !visible) return;
      event.preventDefault();
      if (!event.repeat) { if (game.current.status !== 'running') start(); keyFire.current = true; syncFire(); stepGame(game.current, input.current, 1 / 120); }
    }
    function keyup(event) { if (event.code === 'KeyF') { keyFire.current = false; syncFire(); } }
    const hide = () => { if (document.hidden) { releaseAll(); previous = 0; } };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', releaseAll); document.addEventListener('visibilitychange', hide);
    frame = requestAnimationFrame(tick);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); lens?.dispose(); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', releaseAll); document.removeEventListener('visibilitychange', hide); };
  }, []);
  return <div ref={root} className="playground controller-panel gravity-game" tabIndex={0} aria-label="Gravity Escape game. Drag the joystick to move. Hold F or Fire to shoot." onPointerDown={() => root.current.focus({ preventScroll: true })} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) releaseAll(); }} style={{ '--gx': `${stick.x * 0.13}px`, '--gy': `${stick.y * 0.13}px` }}>
    <div className="gravity-title"><span>GRAVITY ESCAPE</span><span>01 / ENDLESS</span></div>
    <div className="gravity-screen" ref={screen}>
      <canvas className="gravity-scene" ref={canvas} aria-label="Gravity survival playfield" />
      <canvas className="gravity-sun" ref={glass} aria-hidden="true" />
      <div className="gravity-score"><span>SCORE</span><strong>{String(hud.score).padStart(6, '0')}</strong></div>
      {hud.status === 'ready' && <div className="gravity-ready"><strong>Stay out of the pull.</strong><span>Drag the joystick to begin</span></div>}
      {hud.status === 'over' && <div className="gravity-popup" role="status"><span className="gravity-kicker">RUN COMPLETE</span><strong>GAME OVER</strong><span>SCORE: {String(hud.score).padStart(6, '0')}</span><small>Press F or FIRE to restart</small></div>}
      {paused && hud.status === 'running' && <div className="gravity-paused">PAUSED · TOUCH TO RESUME</div>}
      {glassError && <div className="gravity-paused">WebGL is needed for the liquid-glass sun.</div>}
    </div>
    <div className="gravity-controls">
      <div className="gravity-movement"><div className="gravity-socket" ref={socket}>
        <button type="button" className={`gravity-stick ${stickPointer.current !== null ? 'is-dragging' : ''}`} aria-label="Drag joystick to move" style={{ '--sx': `${stick.x}px`, '--sy': `${stick.y}px` }}
          onPointerDown={event => { if (stickPointer.current !== null || event.button !== 0) return; event.preventDefault(); root.current.focus({ preventScroll: true }); stickPointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); if (game.current.status === 'ready') start(); moveStick(event); }}
          onPointerMove={event => { if (stickPointer.current === event.pointerId) moveStick(event); }}
          onPointerUp={event => { if (stickPointer.current === event.pointerId) { event.currentTarget.releasePointerCapture(event.pointerId); releaseStick(); } }} onPointerCancel={releaseStick} onLostPointerCapture={releaseStick}><span /></button>
      </div><div className="gravity-control-label"><strong>MOVE</strong><span>Drag Joystick</span></div></div>
      <div className="gravity-firing"><div className="gravity-control-label"><strong>FIRE</strong><span>F</span></div>
        <button type="button" className={`gravity-fire ${pressed ? 'is-pressed' : ''}`} aria-label="Fire. Hold to shoot; press to restart after game over."
          onPointerDown={event => { if (event.button !== 0 || firePointer.current !== null) return; event.preventDefault(); root.current.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); firePointer.current = event.pointerId; if (game.current.status !== 'running') start(); syncFire(); stepGame(game.current, input.current, 1 / 120); }}
          onPointerUp={event => { if (firePointer.current === event.pointerId) { event.currentTarget.releasePointerCapture(event.pointerId); firePointer.current = null; syncFire(); } }}
          onPointerCancel={() => { firePointer.current = null; syncFire(); }} onLostPointerCapture={() => { firePointer.current = null; syncFire(); }}
          onClick={event => { if (event.detail === 0) { if (game.current.status !== 'running') start(); stepGame(game.current, { ...input.current, fire: true }, 1 / 120); } }}>
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" aria-hidden="true"><path d="M5 39V23Q5 17 10 12Q15 17 15 23V39ZM19 39V16Q19 9 24 4Q29 9 29 16V39ZM33 39V23Q33 17 38 12Q43 17 43 23V39Z" /></svg>
        </button></div>
    </div>
  </div>;
}
