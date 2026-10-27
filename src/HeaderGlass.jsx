import React, { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { renderer } from './useLiquidGlass';

const glassFragment = (small = false) => `precision highp float;
uniform sampler2D scene;
uniform vec2 sceneSize,center,surfaceSize;
uniform float radius;
varying vec2 uv;
vec3 sampleScene(vec2 point){
  if(point.x<0. || point.y<0. || point.x>sceneSize.x || point.y>sceneSize.y) return vec3(.145,.157,.169);
  return texture2D(scene,point/sceneSize).rgb;
}
void main(){
  vec2 p=(uv-.5)*surfaceSize;
  vec2 q=abs(p)-(surfaceSize*.5-vec2(radius));
  float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  vec2 normal;
  if(q.x>0. && q.y>0.) normal=normalize(max(q,0.))*sign(p);
  else normal=q.x>q.y ? vec2(sign(p.x),0.) : vec2(0.,sign(p.y));
  float depth=max(-d,0.);
  float rim=exp(-depth*${small ? '.09' : '.12'});
  vec2 point=center+p;
  vec2 bent=point-normal*(${small ? '1.+rim*30.' : '3.+rim*19.'});
  vec3 transmitted=(sampleScene(bent)*2.+sampleScene(bent+vec2(1.5,0.))+sampleScene(bent-vec2(1.5,0.)))/4.;
  vec3 reflected=sampleScene(point+normal*(${small ? '22.+rim*60.' : '28.+rim*42.'}));
  vec3 color=mix(transmitted,reflected,${small ? '.04+.32*rim' : '.08+.20*rim'});
  // Quiet neutral tint keeps labels readable over passing content.
  color=mix(color,vec3(.145,.157,.169),${small ? '0.' : '.22'});
  color+=${small ? 'vec3(0.)+vec3(.009)' : 'vec3(.014,.018,.021)+vec3(.014)'}*rim*max(dot(normal,normalize(vec2(-.5,-1.))),0.);
  gl_FragColor=vec4(color,1.-smoothstep(-1.,0.,d));
}`;

export default function HeaderGlass() {
  const canvas = useRef(null);
  useEffect(() => {
    const main = document.querySelector('main');
    let material;
    try { material = renderer(canvas.current, 1, { fragment: glassFragment(), radius: 28 }); }
    catch (error) { console.warn('Header glass unavailable; using backdrop fallback.', error); }
    if (!material) return;
    const header = canvas.current.closest('header');
    const lift = header.querySelector('.nav-lift');
    const lensCanvas = lift.querySelector('canvas');
    let lens;
    try { lens = renderer(lensCanvas, 1, { fragment: glassFragment(true), radius: 14 }); }
    catch (error) { console.warn('Navigation glass unavailable; using clear fallback.', error); }
    let disposed = false, busy = false, pending = false, timeout, frame, until = 0;
    const draw = () => {
      if (disposed) return;
      material.draw(main.getBoundingClientRect());
      if (lens && header.dataset.glassReady) {
        // Refract the header's rendered glass, as in the reference's nested buttons.
        lens.upload(canvas.current);
        lens.draw(canvas.current.getBoundingClientRect());
      }
    };
    const animate = time => {
      draw();
      if (!disposed && time < until) frame = requestAnimationFrame(animate);
      else frame = 0;
    };
    const update = () => {
      until = performance.now()+550;
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const capture = async () => {
      if (disposed) return;
      if (busy) { pending = true; return; }
      busy = true;
      try {
        const snapshot = await html2canvas(main, {
          scale:1,backgroundColor:'#25282b',logging:false,
          ignoreElements: element => element.classList?.contains('track-ball'),
        });
        if (!disposed) { material.upload(snapshot); update(); }
      } catch(error) { console.warn('Header glass capture failed.',error); }
      finally { busy = false; if (pending && !disposed) { pending = false; schedule(); } }
    };
    const schedule = () => { clearTimeout(timeout); timeout = setTimeout(capture,150); };
    const resize = new ResizeObserver(schedule); resize.observe(main);
    const mutation = new MutationObserver(schedule);
    mutation.observe(main,{subtree:true,childList:true,characterData:true});
    const liftObserver = new MutationObserver(update);
    liftObserver.observe(lift,{attributes:true,attributeFilter:['style','class']});
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',schedule);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    schedule();
    return () => {
      disposed = true; clearTimeout(timeout); cancelAnimationFrame(frame);
      resize.disconnect(); mutation.disconnect(); liftObserver.disconnect();
      window.removeEventListener('scroll',update); window.removeEventListener('resize',schedule);
      lens?.dispose(); material.dispose();
    };
  },[]);
  return <canvas className="header-glass-surface" ref={canvas} aria-hidden="true" />;
}
