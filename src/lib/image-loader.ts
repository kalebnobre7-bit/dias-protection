import type { ImageLoaderProps } from "next/image";

// Só no build do GitHub Pages: serve o arquivo original com o basePath na frente
export default function pagesImageLoader({ src, width }: ImageLoaderProps): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH}${src}?w=${width}`;
}
