// Generate the Lv3 swim sequence from the existing transparent portrait.
// A single 8x8 atlas holds 64 frames and stays below common Android texture limits.
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'assets/images/momo-levels/level-03-v2.png');
const outputDir = path.join(root, 'assets/images/momo-swim-prototype');
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const frameSize = 384;
// Isolate adjacent poses in the GPU texture. Without this transparent gutter,
// bilinear filtering can sample the next ray pose while the atlas scrolls at
// fractional device pixels, creating a brief double-wing/ghost edge.
const frameGutter = 6;
const cellSize = frameSize + frameGutter * 2;
const framesPerAtlas = 16;
const count = 64;
fs.mkdirSync(outputDir, { recursive: true });

function clamp(value, low = 0, high = 1) { return Math.max(low, Math.min(high, value)); }
function smooth(low, high, value) {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
}
function sample(x, y) {
  const sx = clamp(x, 0, source.width - 1);
  const sy = clamp(y, 0, source.height - 1);
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const dx = sx - x0;
  const dy = sy - y0;
  const result = [0, 0, 0, 0];
  let alpha = 0;
  for (let oy = 0; oy <= 1; oy += 1) {
    for (let ox = 0; ox <= 1; ox += 1) {
      const px = Math.min(source.width - 1, x0 + ox);
      const py = Math.min(source.height - 1, y0 + oy);
      const weight = (ox ? dx : 1 - dx) * (oy ? dy : 1 - dy);
      const offset = (py * source.width + px) * 4;
      const a = source.data[offset + 3] / 255 * weight;
      alpha += a;
      for (let channel = 0; channel < 3; channel += 1) result[channel] += source.data[offset + channel] * a;
    }
  }
  for (let channel = 0; channel < 3; channel += 1) result[channel] = alpha ? Math.round(result[channel] / alpha) : 0;
  result[3] = Math.round(alpha * 255);
  return result;
}
function pixel(image, x, y, rgba) {
  const offset = (y * image.width + x) * 4;
  for (let channel = 0; channel < 4; channel += 1) image.data[offset + channel] = rgba[channel];
}

const atlases = Array.from({ length: count / framesPerAtlas },
  () => new PNG({ width: cellSize * 4, height: cellSize * 4, colorType: 6 }));
for (let frame = 0; frame < count; frame += 1) {
  const phase = frame * Math.PI * 2 / count;
  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const u = x / (frameSize - 1);
      const v = y / (frameSize - 1);
      const left = smooth(.42, .04, u) * (1 - smooth(.71, .81, v));
      const right = smooth(.71, .99, u) * (1 - smooth(.85, .96, v));
      const tail = smooth(.68, .91, v) * (1 - smooth(.39, .54, u));
      const wingWave = left * Math.sin(phase + left * .65)
        + right * Math.sin(phase + right * .9 + .18);
      const sx = u - .028 * wingWave - .03 * tail * Math.sin(phase - Math.PI / 2);
      const sy = v - .095 * wingWave - .012 * tail * Math.sin(phase - Math.PI / 2)
        - .006 * Math.sin(phase);
      const sheet = Math.floor(frame / framesPerAtlas);
      const slot = frame % framesPerAtlas;
      pixel(atlases[sheet], (slot % 4) * cellSize + frameGutter + x,
        Math.floor(slot / 4) * cellSize + frameGutter + y,
        sample(sx * (source.width - 1), sy * (source.height - 1)));
    }
  }
}
const atlas = new PNG({ width: cellSize * 8, height: cellSize * 8, colorType: 6 });
for (const [index, sheet] of atlases.entries()) {
  const offsetX = index % 2 * cellSize * 4;
  const offsetY = Math.floor(index / 2) * cellSize * 4;
  for (let y = 0; y < sheet.height; y += 1) {
    const sourceStart = y * sheet.width * 4;
    const targetStart = ((offsetY + y) * atlas.width + offsetX) * 4;
    sheet.data.copy(atlas.data, targetStart, sourceStart, sourceStart + sheet.width * 4);
  }
}
fs.writeFileSync(path.join(outputDir, 'lv3-swim-atlas.png'), PNG.sync.write(atlas));
