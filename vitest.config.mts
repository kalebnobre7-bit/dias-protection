import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Testes de unidade das regras puras (mensagem do WhatsApp, financeiro, numeração de propostas).
// Sem DOM: o que depende de React/navegador fica fora do escopo por enquanto.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
