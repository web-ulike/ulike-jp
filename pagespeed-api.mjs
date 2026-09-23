import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env.PAGESPEED_API_PORT || 4178);
const preview = new URL(process.env.SHOPIFY_PREVIEW_URL || 'http://127.0.0.1:9292/');
const lighthouseBin = fileURLToPath(new URL('./node_modules/lighthouse/cli/index.js', import.meta.url));
let running = false;

function send(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function audit(path, device) {
  return new Promise((resolve, reject) => {
    const target = new URL(path, preview);
    if (target.origin !== preview.origin || !path.startsWith('/') || path.startsWith('//')) {
      reject(new Error('path must be a relative storefront path beginning with /'));
      return;
    }
    if (device !== 'mobile' && device !== 'desktop') {
      reject(new Error('device must be mobile or desktop'));
      return;
    }

    const reportPath = join(tmpdir(), `ulike-lighthouse-${randomUUID()}.json`);
    const args = [
      lighthouseBin,
      target.href,
      '--only-categories=performance',
      '--output=json',
      `--output-path=${reportPath}`,
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ];
    if (device === 'desktop') args.push('--preset=desktop');

    const child = spawn(process.execPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    child.stderr.on('data', (chunk) => { errors = (errors + chunk).slice(-4000); });
    const timer = setTimeout(() => child.kill('SIGTERM'), 180_000);
    child.on('error', reject);
    child.on('close', async (code) => {
      clearTimeout(timer);
      try {
        if (code !== 0) throw new Error(errors || `Lighthouse exited with status ${code}`);
        const report = JSON.parse(await readFile(reportPath, 'utf8'));
        const metric = (id) => ({
          value: report.audits[id]?.numericValue ?? null,
          display: report.audits[id]?.displayValue ?? null,
        });
        resolve({
          url: report.finalDisplayedUrl,
          device,
          score: Math.round(report.categories.performance.score * 100),
          metrics: {
            fcp: metric('first-contentful-paint'),
            lcp: metric('largest-contentful-paint'),
            tbt: metric('total-blocking-time'),
            cls: metric('cumulative-layout-shift'),
            speedIndex: metric('speed-index'),
          },
          opportunities: Object.values(report.audits)
            .filter((item) => item.details?.overallSavingsMs > 100)
            .map((item) => ({ id: item.id, title: item.title, savingsMs: item.details.overallSavingsMs }))
            .sort((a, b) => b.savingsMs - a.savingsMs),
          warnings: report.runWarnings,
        });
      } catch (error) {
        reject(error);
      } finally {
        await rm(reportPath, { force: true });
      }
    });
  });
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${host}:${port}`);
  if (requestUrl.pathname === '/health') {
    send(response, 200, { ok: true, preview: preview.origin, running });
    return;
  }
  if (request.method !== 'GET' || requestUrl.pathname !== '/api/pagespeed') {
    send(response, 404, { error: 'Use GET /api/pagespeed?path=/&device=mobile' });
    return;
  }
  if (running) {
    send(response, 429, { error: 'An audit is already running' });
    return;
  }
  running = true;
  try {
    const result = await audit(requestUrl.searchParams.get('path') || '/', requestUrl.searchParams.get('device') || 'mobile');
    send(response, 200, result);
  } catch (error) {
    send(response, 400, { error: error.message });
  } finally {
    running = false;
  }
}).listen(port, host, () => {
  console.log(`PageSpeed API: http://${host}:${port}/api/pagespeed?path=/&device=mobile`);
  console.log(`Shopify preview: ${preview.origin}`);
});
