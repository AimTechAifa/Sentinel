export function ArchitectureDiagram() {
  return (
    <div className="bg-white ta-card p-6">
      <h3 className="font-semibold text-gray-800 mb-4 text-sm">Architecture</h3>
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
        {["Connectors", "Shared Release Record", "Agents", "Dashboard / Chat"].map((box, i) => (
          <div key={box} className="flex items-center gap-2">
            <div className="px-4 py-2 bg-slate-100 border border-gray-200 rounded-lg font-medium text-gray-700">{box}</div>
            {i < 3 && <span className="text-gray-400">→</span>}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">Agents read and annotate only — never act directly on systems</p>
    </div>
  );
}
