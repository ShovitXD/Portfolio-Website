import { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

// Adapted from the reference's page-snapshot + shape-normal refraction approach.
// Both droplets share one capture; dragging only redraws their tiny GPU surfaces.
const vertex = `attribute vec2 position; varying vec2 uv;
void main(){ uv=position*.5+.5; gl_Position=vec4(position.x,-position.y,0.,1.); }`;
const fragment = `precision highp float;
uniform sampler2D scene;
uniform vec2 sceneSize, center;
uniform float radius, pixelSize;
uniform vec3 tint;
varying vec2 uv;
vec3 sampleScene(vec2 point){return texture2D(scene,clamp(point/sceneSize,vec2(.001),vec2(.999))).rgb;}
void main(){
  vec2 p=(uv-.5)*2.;
  float r=length(p);
  if(r>1.) discard;
  float z=sqrt(max(0.,1.-r*r));
  vec3 normal=vec3(p,z);
  // A water lens: enlarged center and increasingly reversed sampling at the rim.
  vec3 ray=refract(vec3(0.,0.,-1.),normal,1./1.333);
  vec2 through=center+p*radius+ray.xy*(radius*3.2);
  vec3 transmitted=sampleScene(through);
  // Screen-space environment reflection: nearby page elements wrap over the dome.
  vec3 reflectedRay=reflect(vec3(0.,0.,-1.),normal);
  vec2 reflectedPoint=center+reflectedRay.xy*radius*8.;
  vec3 reflected=sampleScene(reflectedPoint);
  float fresnel=.28+.48*pow(1.-z,3.);
  vec3 color=mix(transmitted,reflected*1.3,fresnel);
  color=mix(color,color*tint*1.2,.12);
  // Subtle water surface lighting, without a painted border or white shine patch.
  float light=max(dot(normal,normalize(vec3(-.45,-.65,1.))),0.);
  color*=.91+.18*light;
  float glint=pow(max(dot(normal,normalize(vec3(-.4,-.58,1.8))),0.),55.);
  color+=vec3(.065)*glint;
  color+=tint*.028*pow(max(dot(normal,normalize(vec3(.4,.7,.4))),0.),18.);
  float alpha=1.-smoothstep(1.-pixelSize,1.,r);
  gl_FragColor=vec4(color,alpha);
}`;

export function renderer(canvas, index, options = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return null;
  const shaders = [ [gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, options.fragment || fragment] ].map(([type, source]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  });
  const program = gl.createProgram();
  shaders.forEach(shader => gl.attachShader(program, shader)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const uniforms = Object.fromEntries(['sceneSize','center','radius','pixelSize','tint','surfaceSize'].map(name => [name,gl.getUniformLocation(program,name)]));
  gl.uniform3fv(uniforms.tint, index === 0 ? [.98,.78,.61] : [.68,.86,1.]);
  let ready = false;
  return {
    upload(snapshot) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snapshot);
      ready = true;
    },
    draw(bounds) {
      if (!ready) return;
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(1,Math.round(rect.width * Math.min(devicePixelRatio,2)));
      const height = Math.max(1,Math.round(rect.height * Math.min(devicePixelRatio,2)));
      if (canvas.width !== size || canvas.height !== height) { canvas.width = size; canvas.height = height; }
      gl.viewport(0,0,size,height);
      gl.uniform2f(uniforms.surfaceSize,rect.width,rect.height);
      gl.uniform2f(uniforms.sceneSize,bounds.width,bounds.height);
      gl.uniform2f(uniforms.center,rect.left+rect.width/2-bounds.left,rect.top+rect.height/2-bounds.top);
      gl.uniform1f(uniforms.radius,options.radius || rect.width/2);
      gl.uniform1f(uniforms.pixelSize,2/size);
      gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.parentElement.dataset.glassReady = 'true';
    },
    dispose() {
      delete canvas.parentElement.dataset.glassReady;
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    }
  };
}

export default function useLiquidGlass(arena, angles, sceneState) {
  const controller = useRef(null);
  useEffect(() => {
    const root = arena.current.closest('.hero');
    let disposed = false, busy = false, pending = false, timeout;
    const renderers = [...arena.current.querySelectorAll('.track-ball canvas')].map((canvas,index) => renderer(canvas,index)).filter(Boolean);
    const draw = () => {
      if (!disposed) renderers.forEach(item => item.draw(root.getBoundingClientRect()));
    };
    const capture = async () => {
      if (disposed || !renderers.length) return;
      if (busy) { pending = true; return; }
      busy = true;
      try {
        const snapshot = await html2canvas(root, {
          scale: 1, backgroundColor: '#25282b', logging: false,
          ignoreElements: element => element.classList?.contains('track-ball'),
        });
        if (!disposed) { renderers.forEach(item => item.upload(snapshot)); draw(); }
      } catch (error) { console.warn('Liquid glass capture failed; using translucent fallback.',error); }
      finally { busy = false; if (pending && !disposed) { pending = false; schedule(); } }
    };
    const schedule = () => { clearTimeout(timeout); timeout = setTimeout(capture,100); };
    controller.current = { draw, schedule };
    const resize = new ResizeObserver(schedule); resize.observe(root);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    schedule();
    return () => {
      disposed = true; clearTimeout(timeout); resize.disconnect();
      renderers.forEach(item => item.dispose()); controller.current = null;
    };
  }, [arena]);
  useEffect(() => { controller.current?.draw(); }, [angles]);
  useEffect(() => { controller.current?.schedule(); }, [sceneState]);
}
