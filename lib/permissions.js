export function isAdmin(role) {
  return role === "admin";
}

// Gestor = admin ou gerente. Usar em toda rota/tela que hoje é "admin only"
// e deve passar a ser "admin OU gerente", exceto gestão de outros
// admins/gerentes (essa fica restrita a isAdmin).
export function isGestor(role) {
  return role === "admin" || role === "gerente";
}

const ROLE_LABELS = {
  admin: "Admin",
  gerente: "Gerente",
  tecnico: "Técnico",
  parceiro: "Parceiro",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}
