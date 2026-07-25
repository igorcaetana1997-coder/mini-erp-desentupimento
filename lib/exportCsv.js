function escapeCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[;"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Monta a string CSV (separador ";", padrão do Excel em pt-BR, com BOM pra
// acentuação abrir certo) a partir de headers + linhas. Função pura, sem
// dependência de navegador — usável tanto no cliente quanto no servidor.
export function buildCsvString(headers, rows) {
  const linhas = [headers, ...rows].map((linha) => linha.map(escapeCsvValue).join(";"));
  return "﻿" + linhas.join("\r\n");
}

// Monta o CSV e dispara o download no navegador via Blob.
export function downloadCsv(filename, headers, rows) {
  const csv = buildCsvString(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
