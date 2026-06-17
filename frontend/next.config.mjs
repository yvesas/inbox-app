import { fileURLToPath } from "node:url";

// Pasta deste arquivo (o frontend). Sem isso, o Next infere a raiz pelo lockfile
// mais acima no monorepo e aninha a saída standalone num caminho errado.
const projectDir = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera um servidor mínimo e autocontido em .next/standalone para a imagem Docker.
  output: "standalone",
  outputFileTracingRoot: projectDir,
};

export default nextConfig;
