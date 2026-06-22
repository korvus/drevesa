# AGENTS.md — drevesa

## Mission

Carte interactive **trilingue (FR / EN / SL)** des « arbres et allées de l'année »
élus par les citoyens de Ljubljana depuis 2019, avec histoires, sources et contexte.

Site public : **https://drevesa.200.work**

## Stack

- **Vite 8** (React 18) — migré depuis Create React App. Bundler = Rolldown/oxc.
- **pnpm** (corepack, `pnpm@11.8.0`). Build-scripts autorisés via `pnpm-workspace.yaml`
  (`puppeteer: true` pour le pré-rendu ; `core-js: false`).
- **Leaflet / react-leaflet** pour la carte.
- Pas de react-router : **routage par langue custom** via `window.location.pathname`
  (voir `src/store.jsx`). SEO injecté en direct dans le `<head>` par `src/components/seo.js`.

## Commandes

```
pnpm install          # corepack pnpm
pnpm dev              # serveur de dev Vite
pnpm build            # vite build -> dist/  PUIS  node scripts/prerender.mjs
pnpm preview          # sert dist/ (utilisé par le pré-rendu)
pnpm export:tour      # script data annexe (scripts/export-tree-tour.mjs)
```

## Pré-rendu SEO par langue

`pnpm build` = `vite build` puis **`scripts/prerender.mjs`** (remplace react-snap,
incompatible Vite). Il sert `dist/` via `vite preview` et, avec **Puppeteer**, visite
`/`, `/fr`, `/en`, `/sl` (UA `ReactSnap` pour ne pas injecter le gtag) et écrit le HTML
pré-rendu dans `dist/{,fr,en,sl}/index.html`. Le `public/.htaccess` sert ensuite ces
pages physiques (alias `/si` → `/sl/`, fallback SPA).

⚠️ Le Chrome de Puppeteer exige des libs système. En CI : step apt (noms **t64**,
dont **`libatspi2.0-0t64`** requis par le Chrome moderne). En local sur le NUC, ces 6
libs sont installées.

## Déploiement (CI — `.github/workflows/deploy.yml`, branch-aware)

Hébergeur **Hostinger** (compte `u372623295`, domaine `200.work`), déploiement **FTPS**
(SamKirkland, + retry anti-throttle IP Hostinger → re-run = nouvelle IP).

| Branche | Cible (var repo) | URL | Accès |
|---|---|---|---|
| `main` | `DEPLOY_DIR` = `/domains/200.work/public_html/drevesa/` | https://drevesa.200.work | public |
| `dev`  | `DEPLOY_DIR_DEV` = `…/dev-drevesa/` | https://dev-drevesa.200.work | **Basic Auth** |

Le verrou staging = `.htpasswd` + bloc Basic Auth **ajouté** (append) à `dist/.htaccess`
au moment du déploiement `dev` (secrets `DEV_USER`/`DEV_PASS`). Identifiants dev communs
à tous les staging du homelab (`~/.config/dev-auth/env`).

Flux : travailler sur `dev` → push → staging. Quand validé → **merge `dev` → `main`** =
déploiement prod (avec permission explicite).

## Env

- **Build-time public** : `import.meta.env.VITE_*` (aucune utilisée actuellement —
  l'ancien `VITE_VERCEL_ANALYTICS_ID` a été retiré, le site n'est plus sur Vercel).
- **Analytics** : Google Analytics (gtag `G-V6S1TYT56R`) en dur dans `index.html`,
  **désactivé sur les hosts `dev-*`** (le staging ne pollue pas les stats).
- Pas de secret runtime côté serveur (site 100 % statique).

## Quirks

- La racine `/` rend en **français** par défaut (l'anglais est sur `/en`).
- Fichiers JSX en `.jsx` (Vite 8/Rolldown n'accepte pas le JSX dans des `.js`) ; les
  imports utilisent l'extension explicite (`./x.jsx`).
