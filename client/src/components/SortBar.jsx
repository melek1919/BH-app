import { ChevronDown } from "lucide-react";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

export default function SortBar({ options, sortKey, sortDir, onChange }) {
  return (
    <div className="d-flex align-items-center gap-1">
      <span style={{ fontSize: 12, color: MUTED, whiteSpace: "nowrap", fontWeight: 500, marginRight: 1 }}>Trier</span>
      <div className="position-relative" style={{ minWidth: 150 }}>
        <select
          value={sortKey}
          onClick={(e) => { e.target.dataset.prev = e.target.value; }}
          onChange={(e) => {
            if (e.target.dataset.prev === e.target.value) {
              onChange(e.target.value, sortDir === "asc" ? "desc" : "asc");
            } else {
              onChange(e.target.value, "asc");
            }
          }}
          style={{
            fontSize: 12.5,
            padding: "6px 32px 6px 26px",
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            backgroundColor: "#fff",
            color: NAVY,
            fontWeight: 600,
            width: "100%",
            appearance: "none",
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 1px 2px rgba(11,31,56,0.06)",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,31,56,0.08)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "0 1px 2px rgba(11,31,56,0.06)"; }}
        >
          {options.map((opt) => (
            <option key={opt.key} value={opt.key} style={{ padding: "6px 10px" }}>{opt.label}</option>
          ))}
        </select>
        <span
          style={{
            position: "absolute",
            left: 9,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: NAVY,
            fontWeight: 700,
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
        <ChevronDown size={13} color={MUTED} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}
