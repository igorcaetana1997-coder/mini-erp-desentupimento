import fs from "node:fs";
import path from "node:path";

// No servidor não existe origem HTTP nem DOM — as <Image src="/logo...png">
// hardcoded no DocumentoPdfShell não resolvem. Aqui a gente lê os PNGs de
// public/ direto do filesystem e converte pra data URI, que o react-pdf
// aceita em qualquer ambiente.
let cached = null;

export function getPdfAssets() {
  if (cached) return cached;
  const toDataUri = (filename) => {
    const base64 = fs.readFileSync(path.join(process.cwd(), "public", filename)).toString("base64");
    return `data:image/png;base64,${base64}`;
  };
  cached = {
    logoSrc: toDataUri("logo-horizontal-outline.png"),
    watermarkSrc: toDataUri("logo-icon-outline.png"),
  };
  return cached;
}
