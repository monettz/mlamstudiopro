import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextCli = require.resolve('next/dist/bin/next');
const host = process.env.MLAM_BIND_HOST || '127.0.0.1';
const port = process.env.PORT || '4180';

if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error('PORT must be a valid TCP port number.');
}

const server = spawn(process.execPath, [nextCli, 'start', '-H', host, '-p', port], {
  stdio: 'inherit',
  windowsHide: true,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}

server.on('error', error => {
  console.error('Could not start the Next.js server:', error);
  process.exitCode = 1;
});
server.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
