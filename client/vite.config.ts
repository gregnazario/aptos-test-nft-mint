// @ts-ignore
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => ({
  build: {
    outDir: "build",
    sourcemap: true,
  },
  // eslint-disable-next-line max-len
  // in addition to the default VITE_ prefix, also support REACT_APP_ prefixed environment variables for compatibility reasons with legacy create-react-app.
  envPrefix: ["VITE_", "REACT_APP_"],
  plugins: [react(), viteTsConfigPaths()],
}));
