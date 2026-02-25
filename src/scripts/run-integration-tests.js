const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const COMPOSE = 'docker-compose';
const BASE = process.env.BASE_URL || 'http://localhost:8080';
const POLL_PATH = process.env.POLL_PATH || '/api/v1/bookstore';
const TIMEOUT_MS = parseInt(process.env.INTEGRATION_READY_TIMEOUT_MS, 10) || 180000; // 3 minutes
const POLL_INTERVAL = 2000;

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    p.on('exit', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
    p.on('error', reject);
  });
}

function checkReady(urlPath) {
  return new Promise((resolve) => {
    const url = new URL(urlPath, BASE);
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForReady() {
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    const ok = await checkReady(POLL_PATH);
    if (ok) return true;
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  return false;
}

async function main() {
  const cwd = path.resolve(__dirname, '..');

  try {
    console.log('Starting docker-compose stack...');
    await runCmd(COMPOSE, ['up', '--build', '-d'], { cwd });

    console.log(`Waiting for gateway ${BASE}${POLL_PATH} to become ready...`);
    const ready = await waitForReady();
    if (!ready) throw new Error('Gateway did not become ready in time');

    console.log('Running integration tests...');
    await runCmd('npx', ['jest', '--testPathPattern=tests/integration', '--runInBand'], { cwd });
    console.log('Integration tests finished.');
  } catch (err) {
    console.error('Error during integration test run:', err.message || err);
    process.exitCode = 1;
  } finally {
    console.log('Tearing down docker-compose stack...');
    try { await runCmd(COMPOSE, ['down', '--volumes'], { cwd }); } catch (e) { console.error('docker-compose down failed', e.message || e); }
  }
}

process.on('SIGINT', () => { console.log('Interrupted'); process.exit(1); });

main();
