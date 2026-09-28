import type { NextConfig } from "next";

// GITHUB_PAGES=true gera o site estático em out/ servido em /dias-protection (build da Vercel segue normal)
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/dias-protection" : "";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(pages && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
  }),
};

export default nextConfig;
