export const SETTINGS = { fireCooldown: 0.17, bulletLife: 1.4, thrust: 220, maxSpeed: 215, gravity: 480000, points: 100 };
const rand = (a, b) => a + Math.random() * (b - a);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const polygon = () => Array.from({ length: 7 }, () => rand(0.75, 1));

export function createGame(width = 480, height = 390) {
  return { width, height, sun: { x: width / 2, y: height / 2, r: 29 },
    player: { x: width * 0.25, y: height * 0.38, vx: 0, vy: 0, angle: -Math.PI / 2, r: 10 },
    meteors: [], bullets: [], fragments: [], score: 0, elapsed: 0, spawnIn: 0.8, cooldown: 0, status: 'ready' };
}

export function spawnMeteor(game) {
  const side = Math.floor(rand(0, 4)), r = rand(12, 23);
  const x = side === 0 ? -r : side === 1 ? game.width + r : rand(0, game.width);
  const y = side === 2 ? -r : side === 3 ? game.height + r : rand(0, game.height);
  const angle = Math.atan2(game.sun.y - y, game.sun.x - x) + rand(-0.7, 0.7);
  const speed = rand(22, 42) + Math.min(40, game.elapsed * 0.3);
  game.meteors.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r, angle: rand(0, 6), spin: rand(-1, 1), shape: polygon() });
}

function attract(body, sun, dt, strength = 1) {
  const dx = sun.x - body.x, dy = sun.y - body.y, d = Math.max(30, Math.hypot(dx, dy));
  const acceleration = Math.min(190, SETTINGS.gravity / (d * d)) * strength;
  body.vx += dx / d * acceleration * dt; body.vy += dy / d * acceleration * dt;
}
function move(body, dt) { body.x += body.vx * dt; body.y += body.vy * dt; }
function shatter(game, meteor) {
  const count = Math.floor(rand(4, 9));
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2 + rand(-0.3, 0.3), speed = rand(35, 95), life = rand(0.4, 0.7);
    game.fragments.push({ x: meteor.x, y: meteor.y, vx: meteor.vx + Math.cos(angle) * speed,
      vy: meteor.vy + Math.sin(angle) * speed, r: rand(2, 5), angle, spin: rand(-5, 5), life, maxLife: life, shape: polygon() });
  }
}

// Small fixed simulation steps prevent bullets and fatal contacts tunnelling.
export function stepGame(game, input, dt) {
  if (game.status !== 'running') return;
  game.elapsed += dt; game.spawnIn -= dt;
  if (game.spawnIn <= 0) { spawnMeteor(game); game.spawnIn = Math.max(0.32, 1.5 - game.elapsed * 0.012); }
  const p = game.player;
  attract(p, game.sun, dt);
  p.vx += input.x * SETTINGS.thrust * dt; p.vy += input.y * SETTINGS.thrust * dt;
  const damping = Math.exp(-0.65 * dt); p.vx *= damping; p.vy *= damping;
  const speed = Math.hypot(p.vx, p.vy);
  if (speed > SETTINGS.maxSpeed) { p.vx *= SETTINGS.maxSpeed / speed; p.vy *= SETTINGS.maxSpeed / speed; }
  if (Math.hypot(input.x, input.y) > 0.04) {
    const target = Math.atan2(input.y, input.x);
    const delta = Math.atan2(Math.sin(target - p.angle), Math.cos(target - p.angle));
    p.angle += delta * (1 - Math.exp(-14 * dt));
  }
  move(p, dt);
  for (const [axis, velocity, size] of [['x', 'vx', game.width], ['y', 'vy', game.height]]) {
    if (p[axis] < p.r || p[axis] > size - p.r) { p[axis] = Math.max(p.r, Math.min(size - p.r, p[axis])); p[velocity] *= -0.25; }
  }
  game.cooldown = Math.max(0, game.cooldown - dt);
  if (input.fire && game.cooldown <= 0) {
    const dx = Math.cos(p.angle), dy = Math.sin(p.angle);
    game.bullets.push({ x: p.x + dx * 15, y: p.y + dy * 15, vx: dx * 440 + p.vx, vy: dy * 440 + p.vy, life: SETTINGS.bulletLife });
    game.cooldown = SETTINGS.fireCooldown;
  }
  for (const meteor of game.meteors) { attract(meteor, game.sun, dt); move(meteor, dt); meteor.angle += meteor.spin * dt; }
  // Sun absorption precedes bullet hits; no points or debris.
  game.meteors = game.meteors.filter(m => distance(m, game.sun) > m.r + game.sun.r);
  if (distance(p, game.sun) <= p.r + game.sun.r || game.meteors.some(m => distance(p, m) <= p.r + m.r)) {
    game.status = 'over'; return;
  }
  for (const bullet of game.bullets) {
    move(bullet, dt); bullet.life -= dt;
    const hit = game.meteors.findIndex(m => distance(bullet, m) <= m.r + 4);
    if (hit !== -1) { shatter(game, game.meteors[hit]); game.meteors.splice(hit, 1); game.score += SETTINGS.points; bullet.life = 0; }
  }
  game.bullets = game.bullets.filter(b => b.life > 0 && b.x > -10 && b.x < game.width + 10 && b.y > -10 && b.y < game.height + 10);
  for (const fragment of game.fragments) { attract(fragment, game.sun, dt, 0.5); move(fragment, dt); fragment.life -= dt; fragment.angle += fragment.spin * dt; }
  game.fragments = game.fragments.filter(f => f.life > 0 && distance(f, game.sun) > f.r + game.sun.r);
  game.meteors = game.meteors.filter(m => m.x > -100 && m.x < game.width + 100 && m.y > -100 && m.y < game.height + 100);
}

export function drawGame(ctx, game) {
  ctx.fillStyle = '#25282B'; ctx.fillRect(0, 0, game.width, game.height);
  const preview = game.status === 'ready' ? [[0.72, 0.24, 17], [0.85, 0.58, 12], [0.67, 0.77, 22], [0.18, 0.65, 16]].map(([x, y, r]) => ({ x: x * game.width, y: y * game.height, r, angle: x * 4, shape: [1, 0.83, 0.95, 0.86, 1, 0.79, 0.92] })) : [];
  for (const rock of [...preview, ...game.meteors, ...game.fragments]) {
    ctx.save(); ctx.translate(rock.x, rock.y); ctx.rotate(rock.angle);
    ctx.globalAlpha = rock.life === undefined ? 1 : Math.max(0, rock.life / rock.maxLife);
    ctx.fillStyle = '#C68A62'; ctx.beginPath();
    rock.shape.forEach((radius, i) => { const angle = i / rock.shape.length * Math.PI * 2; ctx.lineTo(Math.cos(angle) * rock.r * radius, Math.sin(angle) * rock.r * radius); });
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  for (const b of game.bullets) { const a = Math.atan2(b.vy, b.vx); ctx.beginPath(); ctx.moveTo(b.x - Math.cos(a) * 4, b.y - Math.sin(a) * 4); ctx.lineTo(b.x + Math.cos(a) * 4, b.y + Math.sin(a) * 4); ctx.stroke(); }
  const p = game.player;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = '#F5F3EF';
  ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-11, 10); ctx.lineTo(-5, 0); ctx.lineTo(-11, -10); ctx.closePath(); ctx.fill(); ctx.restore();
}
