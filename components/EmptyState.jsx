export default function EmptyState({ text }) {
  return (
    <div className="border-2 border-dashed border-[rgb(var(--border-strong)/0.25)] text-[rgb(var(--stone))] text-sm px-4 py-6 text-center">
      {text}
    </div>
  );
}
