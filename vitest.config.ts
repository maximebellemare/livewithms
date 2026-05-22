import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "src/components/sparkline/GenericSparkline.a11y.test.tsx",
      "src/components/sparkline/GenericSparkline.test.tsx",
      "src/components/sparkline/SparklineSvg.test.tsx",
      "src/components/sparkline/useLongPress.test.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
