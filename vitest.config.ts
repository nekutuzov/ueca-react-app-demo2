import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// Tests reuse the app's Vite config, so the path aliases (@components, @core, @api, @screens) and
// the React transform resolve exactly as they do in the app.
export default mergeConfig(viteConfig, defineConfig({
    test: {
        // ueca-react touches `window` at import time, and the @components/@core barrels pull it into
        // every module, so even pure-logic tests need a DOM.
        environment: "jsdom",
        // The address the dev server serves the app from, so <base>-relative routing reads the
        // same paths it does in the browser. src/test/setup.ts restores it after every test.
        environmentOptions: {
            jsdom: { url: "http://localhost:5001/ueca-react-app-demo2/" }
        },
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        restoreMocks: true,
        unstubGlobals: true,
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/**/*.test.{ts,tsx}",
                "src/**/*.testUtils.{ts,tsx}",
                "src/test/**",
                "src/integration/**",
                "src/main.tsx",
                "src/vite-env.d.ts"
            ],
            reporter: ["text-summary", "html"]
        }
    }
}));
