# Reid — Custom Software

Personal developer portfolio for Reid, built with Vite, React, and TypeScript.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run build
npm run scan:public
npm run preview -- --host 127.0.0.1 --port 4173
npm run verify:site
```

The browser verifier uses the locally installed Google Chrome executable and
writes responsive evidence to `verification/site/`.

## Deployment

Push `main` to the `reidklassen-design.github.io` repository. The Pages workflow
builds, scans, and deploys the site.
