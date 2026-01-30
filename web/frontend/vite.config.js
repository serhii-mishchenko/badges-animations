import { defineConfig, loadEnv } from "vite";
import { dirname, resolve as pathResolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Empty prefix means load all env variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Expose SHOPIFY_API_KEY as VITE_SHOPIFY_API_KEY for frontend access
  // Vite automatically exposes variables prefixed with VITE_ to the frontend
  if (env.SHOPIFY_API_KEY) {
    process.env.VITE_SHOPIFY_API_KEY = env.SHOPIFY_API_KEY;
  } else {
    throw new Error(
      "\n\nThe frontend build will not work without an API key. Set the SHOPIFY_API_KEY environment variable when running the build command, for example:" +
        "\n\nSHOPIFY_API_KEY=<your-api-key> npm run build\n"
    );
  }

  if (env.EXTENSION_NAME) {
    process.env.VITE_EXTENSION_NAME = env.EXTENSION_NAME;
  } else {
    throw new Error(
      "\n\nThe frontend build will not work without an extension name. Set the EXTENSION_NAME environment variable when running the build command, for example:" +
        "\n\nEXTENSION_NAME=<your-extension-name> npm run build\n"
    );
  }

  if (
    process.env.npm_lifecycle_event === "build" &&
    !process.env.CI &&
    !env.SHOPIFY_API_KEY
  ) {
    throw new Error(
      "\n\nThe frontend build will not work without an API key. Set the SHOPIFY_API_KEY environment variable when running the build command, for example:" +
        "\n\nSHOPIFY_API_KEY=<your-api-key> npm run build\n"
    );
  }

  const proxyOptions = {
    target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
    changeOrigin: false,
    secure: true,
    ws: false,
  };

  const host = process.env.HOST
    ? process.env.HOST.replace(/https?:\/\//, "")
    : "localhost";

  let hmrConfig;
  if (host === "localhost") {
    hmrConfig = {
      protocol: "ws",
      host: "localhost",
      port: 64999,
      clientPort: 64999,
    };
  } else {
    hmrConfig = {
      protocol: "wss",
      host: host,
      port: process.env.FRONTEND_PORT,
      clientPort: 443,
    };
  }

  return {
    root: root,
    plugins: [react()],
    resolve: {
      alias: {
        '@/hooks': pathResolve(root, 'hooks'),
        '@/providers': pathResolve(root, 'providers'),
        '@/shared': pathResolve(root, 'shared'),
        '@/components': pathResolve(root, 'components'),
      },
      preserveSymlinks: true,
    },
    server: {
      host: "localhost",
      port: process.env.FRONTEND_PORT,
      hmr: hmrConfig,
      proxy: {
        "^/(\\?.*)?$": proxyOptions,
        "^/api(/|(\\?.*)?$)": proxyOptions,
      },
    },
  };
});
