// Monta uma linha de endereço legível a partir dos campos estruturados do
// cliente (logradouro/número/complemento/bairro/cidade/uf), tolerando campos
// em branco (cadastros antigos ou incompletos).
export function formatEndereco(cliente) {
  if (!cliente) return "";

  const linha1 = [cliente.logradouro, cliente.numero].filter(Boolean).join(", ");
  const comComplemento = cliente.complemento ? [linha1, cliente.complemento].filter(Boolean).join(" - ") : linha1;

  const cidadeUf = cliente.cidade && cliente.uf ? `${cliente.cidade}/${cliente.uf}` : cliente.cidade || cliente.uf;
  const linha2 = [cliente.bairro, cidadeUf].filter(Boolean).join(" - ");

  return [comComplemento, linha2].filter(Boolean).join(" — ");
}
