export const STATUS = {
  aberta: { label: "Aberta", bg: "#E8A33D", text: "#1a1208" },
  andamento: { label: "Em andamento", bg: "#1E7A52", text: "#F2EFE9" },
  concluida: { label: "Concluída", bg: "#3d4a44", text: "#F2EFE9" },
  recusada: { label: "Recusada", bg: "#A02018", text: "#F2EFE9" },
};

export const STATUS_ORDER = ["aberta", "andamento", "concluida"];

export default function Stamp({ status }) {
  const s = STATUS[status];
  return (
    <span
      className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest -rotate-2 border-2"
      style={{ background: s.bg, color: s.text, borderColor: s.text + "33" }}
    >
      {s.label}
    </span>
  );
}
