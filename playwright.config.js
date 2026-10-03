import { defineConfig } from '@playwright/test';

const baseURL = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4174';
const port = Number(new URL(baseURL).port) || 4174;

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  // Full shipment loops render animated WebGL scenes on CPU-only CI runners.
  // Keep the same budget with or without optional screenshot capture.
  timeout: 60000,
  reporter: 'list',
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      // Use the same software WebGL backend locally and in GitHub Actions.
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: baseURL, reuseExistingServer: !process.env.CI },
});
