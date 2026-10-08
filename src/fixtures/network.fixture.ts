import { test as base } from '@playwright/test';

// Ad and analytics hosts. Not part of the app, and their pop-ups cover the page and swallow clicks.
// Blocking at the network layer is deterministic; "close the ad if it appears" is not (DECISIONS #3).
const AD_HOSTS = /doubleclick|googlesyndication|googleadservices|google-analytics|googletagmanager|adtrafficquality|fundingchoicesmessages/;

// Overrides Playwright's own `context` so every test blocks ad traffic before any page loads.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route('**/*', (route) =>
      AD_HOSTS.test(new URL(route.request().url()).hostname) ? route.abort() : route.continue(),
    );
    await use(context);
  },
});
