import { createServer } from 'node:http';
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outputs = [
  resolve(here, '../../../../../../api/src/MemoPal.Api/Assets/Companions/avatars'),
  resolve(here, '../../../../../assets/images/momo-portraits'),
];
const canvasPackage = dirname(createRequire(import.meta.url).resolve('@rive-app/canvas/rive.js'));
const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((candidate) => candidate && existsSync(candidate));
if (!chrome) throw new Error('Set CHROME_PATH to a Chrome or Edge executable to export portraits.');
const stages = Array.from({ length: 10 }, (_, index) => index + 1);

const page = `<!doctype html><html><body><pre id="result"></pre><script src="/rive.js"></script><script>
const stages = ${JSON.stringify(stages)};
const results = {};
let loaded = 0;
for (const stage of stages) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  document.body.appendChild(canvas);
  const name = 'Momo ' + String(stage).padStart(2, '0');
  new rive.Rive({
    src: '/momo.riv', canvas, artboard: name,
    stateMachines: 'Momo Companion', autoplay: true,
    layout: new rive.Layout({ fit: rive.Fit.Contain }),
    onLoad() {
      loaded++;
      if (loaded === stages.length) setTimeout(() => {
        for (let i = 0; i < stages.length; i++) results[stages[i]] = document.querySelectorAll('canvas')[i].toDataURL('image/png');
        document.getElementById('result').textContent = JSON.stringify(results);
      }, 350);
    },
    onLoadError(error) { document.getElementById('result').textContent = 'ERROR:' + String(error); }
  });
}
</script></body></html>`;

const server = createServer((request, response) => {
  const files = {
    '/rive.js': [join(canvasPackage, 'rive.js'), 'text/javascript'],
    '/rive.wasm': [join(canvasPackage, 'rive.wasm'), 'application/wasm'],
    '/rive_fallback.wasm': [join(canvasPackage, 'rive_fallback.wasm'), 'application/wasm'],
    '/momo.riv': [join(here, 'momo.riv'), 'application/octet-stream'],
  };
  const asset = files[request.url];
  response.setHeader('Content-Type', asset?.[1] ?? 'text/html');
  response.end(asset ? readFileSync(asset[0]) : page);
});

try {
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const { stdout, stderr } = await promisify(execFile)(chrome, [
    '--headless=new', '--no-first-run', '--disable-gpu-sandbox', '--virtual-time-budget=10000',
    '--dump-dom', url,
  ], { maxBuffer: 60 * 1024 * 1024, timeout: 120000 });
  const match = stdout.match(/<pre id="result">([^<]+)<\/pre>/);
  if (!match || match[1].startsWith('ERROR:')) throw new Error(match?.[1] ?? stderr.slice(-1000));
  const images = JSON.parse(match[1]);
  for (const output of outputs) mkdirSync(output, { recursive: true });
  for (const stage of stages) {
    const base64 = images[stage]?.split(',')[1];
    if (!base64) throw new Error(`Missing portrait ${stage}`);
    const image = Buffer.from(base64, 'base64');
    for (const output of outputs) writeFileSync(join(output, `momo-${String(stage).padStart(2, '0')}.png`), image);
  }
  console.log(`Exported ${stages.length} Momo portraits to each avatar asset directory`);
} finally {
  server.close();
}
