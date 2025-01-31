import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    testTimeout: 200000,
    globals: true,
  },
})
