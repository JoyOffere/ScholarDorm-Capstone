import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "9tn7p1",
  e2e: {
    // Remove baseUrl to avoid localhost dependency
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      PRODUCTION_URL: 'https://scholardorm-lms.vercel.app',
      LOCALHOST_URL: 'http://localhost:5173'
    }
  },
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
