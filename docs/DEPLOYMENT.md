# Deployment

## Current public demo

**Mode:** Interactive browser demo.

Published to Cloudflare Pages. HTML, required assets, security headers and missing-API 404 behavior were verified.

[Open interactive app](https://echo-canvas-lab.pages.dev)

The complete existing geometry editor, worker, presets, import/export and audio graph run in the visitor’s browser. Files and audio remain local. No Python backend, database, account, model API or hardware is needed for the public app.

## Cloudflare Pages settings

| Setting | Value |
| --- | --- |
| Repository | `victorhuii/echo-canvas-lab` |
| Production branch | `main` |
| Framework | None / custom |
| Root directory | Repository root |
| Build command | `python3 scripts/build_demo.py` |
| Output directory | `site` |

Connect this repository in Workers & Pages, select Pages and import the Git repository. The committed `wrangler.jsonc` records the output directory; no credentials or account IDs are committed. Cloudflare supplies the deployed URL after a successful build. Do not add a guessed `pages.dev` URL to the profile.

For a direct upload after local checks:

```sh
python3 scripts/build_demo.py
python3 scripts/check_demo.py
npx wrangler pages project create --force echo-canvas-lab --production-branch main
npx wrangler pages deploy --force site --project-name echo-canvas-lab
```

The `--force` option here selects the existing Pages command path when recent Wrangler versions default to Workers migration; it does not bypass application checks or overwrite a project. Run the project-create command only for a new Pages project. Use the actual returned deployment URL. Git-connected Pages builds automatically from subsequent pushes; direct uploads must be repeated after changes. The `demo package` workflow validates and uploads a download-only artifact; it does not deploy or store a Cloudflare token.

## Full application hosting

**Backend:** None: geometry worker and Web Audio run in the browser.

**Storage/jobs:** Browser-local state and selected audio; no server database.

**Remaining public-service work:** Static package is prepared. HTTPS and a user gesture are required for playback; actual device/listening QA remains unverified. No upload endpoint is introduced.

Static Pages does not execute the existing Python HTTP server or native C++ binaries. Reusing the local server with a public bind address is not sufficient production hardening. Use a supervised/containerized service for those runtimes, keep any secrets server-side, and enforce application-specific input/work limits. A Workers port would be a separate implementation and validation effort, not an automatic setting.

## Release checks

- Build/check the exact output directory; deploy only that directory.
- Preserve ownership, source credits and historical/synthetic labels.
- Verify returned HTTPS URL, expected assets, security headers and actual user paths after publishing.
- For API-backed demos, test health, a real data request, exact-origin CORS and visible network errors.
- Keep model artifacts, databases, raw datasets, credentials and private uploads outside the public static bundle.
- Browser visual/audio/device QA was unavailable in this session. Automated checks do not establish that testing.

References: [Cloudflare static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [headers](https://developers.cloudflare.com/pages/configuration/headers/), [asset limits](https://developers.cloudflare.com/pages/platform/limits/).
