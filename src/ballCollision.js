// Dimensions match the groove radius (43%) and ball diameter (11%).
export const BALL_SEPARATION = 2 * Math.asin(11 / (2 * 43)) * 180 / Math.PI;
const wrap = angle => ((angle % 360) + 360) % 360;
export const angularDelta = (from, to) => wrap(to - from + 180) - 180;

// Sweep the whole arc, so a fast pointer move cannot jump through the other ball.
export function pushBall(angles, index, delta) {
  if (!delta) return angles;
  const next = [...angles];
  const other = 1 - index;
  const direction = Math.sign(delta);
  const distanceAhead = wrap(direction * (angles[other] - angles[index]));
  const freeTravel = Math.max(0, distanceAhead - BALL_SEPARATION);
  next[index] = wrap(angles[index] + delta);
  if (Math.abs(delta) > freeTravel) {
    next[other] = wrap(next[index] + direction * BALL_SEPARATION);
  }
  return next;
}
