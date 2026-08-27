import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async ({ command }) => {
  const plugins = [
    tsconfigPaths(),
    tanstackStart({
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    react(),
    tailwindcss(),
  ];

  if (command === "build") {
    // Vercel deployment is handled natively by TanStack Start / Nitro
  }

  return {
    plugins,
    resolve: {
      alias: {

        "@": `${process.cwd()}/src`,
        "~": `${process.cwd()}/src`,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("lucide-react")) {
                return "vendor-lucide";
              }
              if (id.includes("recharts") || id.includes("d3")) {
                return "vendor-charts";
              }
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              return "vendor";
            }
          },
        },
      },
    },
    // Development server proxy to avoid cross-origin cookie issues
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5001",
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: "http://127.0.0.1:5001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
