/**
 * Maps a normalized playback phase onto the periodic 64-frame swim cycle.
 * The source frames are sampled from a full sine wave, so playback wraps forward.
 */
export function swimAtlasFrameAtPhase(phase: number, frameCount = 64) {
  'worklet';
  if (frameCount <= 1) return 0;
  const normalized = ((phase % 1) + 1) % 1;
  return Math.floor(normalized * frameCount);
}

export type SwimPoint = { x: number; y: number };
export type SwimBounds = { x: number; y: number };

/** Sample a gently banked cubic path for native-driver position segments. */
export function sampleSwimCurve(from: SwimPoint, to: SwimPoint, bend: number, steps = 12, bounds?: SwimBounds) {
  const count = Math.max(2, Math.floor(steps));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const firstControl = {
    x: from.x + dx / 3 + normalX * bend,
    y: from.y + dy / 3 + normalY * bend,
  };
  const secondControl = {
    x: from.x + dx * 2 / 3 + normalX * bend,
    y: from.y + dy * 2 / 3 + normalY * bend,
  };
  const points: SwimPoint[] = [];
  for (let index = 0; index <= count; index += 1) {
    const progress = index / count;
    const inverse = 1 - progress;
    const startWeight = inverse ** 3;
    const firstWeight = 3 * inverse ** 2 * progress;
    const secondWeight = 3 * inverse * progress ** 2;
    const endWeight = progress ** 3;
    const x = startWeight * from.x + firstWeight * firstControl.x + secondWeight * secondControl.x + endWeight * to.x;
    const y = startWeight * from.y + firstWeight * firstControl.y + secondWeight * secondControl.y + endWeight * to.y;
    points.push(bounds ? {
      x: Math.max(-bounds.x, Math.min(bounds.x, x)),
      y: Math.max(-bounds.y, Math.min(bounds.y, y)),
    } : { x, y });
  }
  return points;
}
