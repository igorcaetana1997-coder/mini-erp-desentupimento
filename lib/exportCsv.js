function escapeCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[;"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Monta um CSV (separador ";", padrão do Excel em pt-BR) a partir de headers + linhas
// e dispara o download no navegador via Blob, sem depender de nenhuma lib externa.
export function downloadCsv(filename, headers, rows) {
  const linhas = [headers, ...rows].map((linha) => linha.map(escapeCsvValue).join(";"));
  const csv = "﻿" + linhas.join("\r\n");
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
