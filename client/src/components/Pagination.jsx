import { ChevronLeft, ChevronRight } from "lucide-react";

const NAVY = "#0B1F38";
const MUTED = "#6B7684";
const BORDER = "#E4E8EE";

export default function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const singlePage = totalPages <= 1;

  const btnBase = {
    minWidth: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none",
    userSelect: "none",
  };

  const arrowBtn = (disabled, onClick, children) => (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        ...btnBase,
        width: 34,
        backgroundColor: disabled ? "#F5F6F8" : "#fff",
        border: `1px solid ${disabled ? "#EEF0F4" : BORDER}`,
        color: disabled ? "#C5C9D2" : MUTED,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; } }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.93)"; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );

  return (
    <div className="d-flex align-items-center justify-content-center gap-2" style={{ padding: "16px 0 8px" }}>
      <span style={{ fontSize: 12.5, color: MUTED, marginRight: 6, whiteSpace: "nowrap" }}>
        {singlePage ? `${totalPages} page` : `Page ${page} / ${totalPages}`}
      </span>

      {arrowBtn(singlePage || page <= 1, () => onChange(page - 1), <ChevronLeft size={15} />)}

      {!singlePage && (
        <div className="d-flex align-items-center gap-1">
          {start > 1 && (
            <>
              <button
                style={btnBase}
                onClick={() => onChange(1)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F0F2F5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.93)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                1
              </button>
              {start > 2 && <span style={{ fontSize: 12, color: "#B0B8C4", padding: "0 1px", letterSpacing: 1 }}>•••</span>}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              style={{
                ...btnBase,
                backgroundColor: p === page ? NAVY : "transparent",
                color: p === page ? "#fff" : MUTED,
                fontWeight: p === page ? 600 : 500,
                boxShadow: p === page ? "0 2px 8px rgba(11,31,56,0.20)" : "none",
              }}
              onClick={() => p !== page && onChange(p)}
              onMouseEnter={(e) => {
                if (p !== page) {
                  e.currentTarget.style.backgroundColor = "#F0F2F5";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (p !== page) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
              onMouseDown={(e) => { if (p !== page) e.currentTarget.style.transform = "scale(0.93)"; }}
              onMouseUp={(e) => {
                if (p !== page) e.currentTarget.style.transform = "translateY(-1px)";
              }}
            >
              {p}
            </button>
          ))}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span style={{ fontSize: 12, color: "#B0B8C4", padding: "0 1px", letterSpacing: 1 }}>•••</span>}
              <button
                style={btnBase}
                onClick={() => onChange(totalPages)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F0F2F5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.93)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      )}

      {arrowBtn(singlePage || page >= totalPages, () => onChange(page + 1), <ChevronRight size={15} />)}
    </div>
  );
}
