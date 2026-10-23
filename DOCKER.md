# Running HP-Calculator without a VPS

The modern 10bII+-inspired calculator is the default homepage. The original HP 12C emulator is preserved at `/legacy.html`.

## Run with Docker Desktop

Install Docker Desktop and enable its engine. Then clone the repository:

```bash
git clone https://github.com/numbsoheil/HP-Calculator.git
cd HP-Calculator
docker compose up --build -d
```

Open **http://localhost:8080** in your browser.

The application runs entirely in the browser and needs no database, API keys, or VPS. The `docker compose` service listens on `127.0.0.1` only, so other devices cannot reach it by default.

## Commands

```bash
docker compose ps                 # Check service and health
docker compose logs -f            # View nginx logs
docker compose down               # Stop app
PORT=8081 docker compose up -d    # Use another local port (Unix shells)
docker compose up --build -d      # Rebuild after pulling source updates
```

## Automated publishing

The repository includes `.github/workflows/ci.yml`. A single GitHub Actions workflow runs calculator tests inside the Docker build, smoke-tests pull requests, and publishes an image to `ghcr.io/numbsoheil/hp-calculator:latest` on pushes to `main`, subject to GitHub Actions/package permissions. Publishing an image **does not run a server**.

GitHub Pages deploys the static website without requiring Docker or a VPS (if Pages is enabled in repo settings): **https://numbsoheil.github.io/HP-Calculator/**.

GitHub Pages deployment is optional. Until Pages is enabled, CI checks availability and skips deployment without failing. To activate the public site, go to Settings → Pages → Build and deployment → Source → **GitHub Actions**, then rerun **Calculator CI and Deployment**.

## Local tests without Docker

```bash
npm ci
npm test -- --runInBand
npm start
```

Open `http://localhost:8080`. Docker builds also run the Jest test suite before assembling the final image.

## Notes

- The new page is in `modern.html`; `index.html` redirects to it.
- This is still an adaptation prototype with missing financial-key behaviors. A successful container build does not imply feature-complete HP 10bII+ parity.
- This is an independently developed interface on top of the upstream open-source HP 12C implementation, not the proprietary iOS application.
