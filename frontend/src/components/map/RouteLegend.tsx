import React from "react";

type LegendItem = {
  vehicle_id: string;
  color: string;
  visible: boolean;
};

type Props = {
  items: LegendItem[];
  selected?: string | null;
  onSelect: (vehicle_id: string) => void;
  onToggle: (vehicle_id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onFilter?: (kind: "bike" | "car" | string) => void;
  types?: string[];
};

export default function RouteLegend({ items, selected, onSelect, onToggle, onSelectAll, onDeselectAll, onFilter, types }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const maxVisible = 6;
  const visibleItems = expanded ? items : items.slice(0, maxVisible);

  return (
    <div style={{ position: "absolute", right: 12, top: 12, zIndex: 20 }}>
      <div style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: 8,
        padding: 8,
        minWidth: 160,
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        fontSize: 12
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontWeight: 600 }}>Routes</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSelectAll?.()} style={{ background: "#0b63d6", color: "white", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>All</button>
            <button onClick={() => onDeselectAll?.()} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>None</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          {(types || []).map(t => (
            <button key={t} onClick={() => onFilter?.(t)} style={{ background: "transparent", border: "1px solid #e5e7eb", padding: "4px 6px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>{t}</button>
          ))}
        </div>
        {visibleItems.map(item => (
          <div key={item.vehicle_id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color, boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }} />
            <button
              onClick={() => onSelect(item.vehicle_id)}
              style={{
                background: "transparent",
                border: "none",
                textAlign: "left",
                flex: 1,
                cursor: "pointer",
                padding: 0,
                color: selected === item.vehicle_id ? "#0b63d6" : "#111827",
                fontWeight: selected === item.vehicle_id ? 700 : 500,
                fontSize: 12
              }}
            >
              {item.vehicle_id}
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={item.visible}
                onChange={() => onToggle(item.vehicle_id)}
                style={{ width: 12, height: 12, cursor: "pointer" }}
              />
            </label>
          </div>
        ))}

        {items.length > maxVisible && (
          <div style={{ textAlign: "center", marginTop: 6 }}>
            <button onClick={() => setExpanded(!expanded)} style={{ background: "transparent", border: "none", color: "#0b63d6", cursor: "pointer", fontSize: 12 }}>
              {expanded ? 'Show less' : `Show all (${items.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
