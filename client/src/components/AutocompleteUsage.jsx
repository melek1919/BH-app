import { useState, useRef, useEffect } from "react";
import { USAGE_OPTIONS } from "./usageConfig";

const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

export default function AutocompleteUsage({ value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = value
    ? USAGE_OPTIONS.filter((opt) => opt.toLowerCase().startsWith(value.toLowerCase()))
    : USAGE_OPTIONS;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (opt) => {
    onChange(opt);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          select(filtered[highlightIndex]);
        } else if (filtered.length === 1) {
          select(filtered[0]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  const accent = error ? "#B3261E" : focused ? "#0B1F38" : BORDER;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Taper pour rechercher..."
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          fontSize: 13,
          padding: "7px 10px",
          border: `1.5px solid ${accent}`,
          borderRadius: 8,
          outline: "none",
          boxShadow: focused ? `0 0 0 3px ${error ? "rgba(179,38,30,0.10)" : "rgba(11,31,56,0.08)"}` : "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxSizing: "border-box",
        }}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 70,
            backgroundColor: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            marginTop: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {filtered.map((opt, i) => (
            <div
              key={opt}
              onMouseDown={() => select(opt)}
              onMouseEnter={() => setHighlightIndex(i)}
              style={{
                padding: "9px 12px",
                fontSize: 12.5,
                cursor: "pointer",
                backgroundColor: i === highlightIndex ? "#F0F2F5" : "#fff",
                color: "#161B22",
                transition: "background-color 0.08s ease",
                borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && value && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 70,
            backgroundColor: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            marginTop: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "9px 12px",
            fontSize: 12.5,
            color: MUTED,
          }}
        >
          Aucun usage trouvé
        </div>
      )}
    </div>
  );
}
