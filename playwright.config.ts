import { defineConfig, devices } from '@playwright/test'

const externalURL = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: externalURL || 'http://127.0.0.1:3210',
    // Existing feature tests start after onboarding; the intro spec uses a fresh browser.
    storageState: { cookies: [], origins: [{ origin: new URL(externalURL || 'http://127.0.0.1:3210').origin, localStorage: [{ name: 'kanalearn-intro-v1', value: 'done' }] }] },
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalURL ? undefined : {
    command: `${process.platform === 'win32' ? 'npm.cmd' : 'npm'} run dev -- --host 127.0.0.1 --port 3210`,
    url: 'http://127.0.0.1:3210',
    reuseExistingServer: false,
    timeout: 120000,
    env: { NUXT_TELEMETRY_DISABLED: '1' }
  }
})
