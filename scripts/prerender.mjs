// Pré-rendu statique par langue (remplace react-snap, incompatible Vite).
// Après `vite build`, on sert dist/ avec `vite preview`, puis Puppeteer visite
// chaque route, laisse React + seo.js peupler le DOM et le <head>, et on écrit
// le HTML pré-rendu. .htaccess sert ensuite ces fichiers physiques (SEO).
import { preview } from 'vite';
import puppeteer from 'puppeteer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// Mêmes routes que l'ancien reactSnap.include.
const ROUTES = ['/', '/fr', '/en', '/sl'];

const server = await preview({ preview: { port: 4173, strictPort: true } });
const base =
  server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://localhost:4173';
console.log(`[prerender] preview server: ${base}`);

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    // UA "ReactSnap" : conserve le comportement d'origine (le <script> gtag de
    // index.html ne s'injecte pas pendant le pré-rendu).
    await page.setUserAgent('ReactSnap');
    await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 60000 });
    // React monte l'app, puis seo.js peuple <head> (titre/meta/hreflang/JSON-LD).
    await page.waitForSelector('#root > *', { timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    const html =
      '<!DOCTYPE html>\n' +
      (await page.evaluate(() => document.documentElement.outerHTML));

    const outDir = route === '/' ? distDir : join(distDir, route);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html);
    console.log(`[prerender] ${route} -> dist${route === '/' ? '' : route}/index.html`);
    await page.close();
  }
} finally {
  await browser.close();
  server.httpServer.close();
}

console.log('[prerender] done.');
process.exit(0);
