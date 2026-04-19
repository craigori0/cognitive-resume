"use client";

import { useMemo, useState } from "react";
import type { ProjectRow } from "@/lib/types";

interface ProjectTableProps {
  rows: ProjectRow[];
}

const TIER_ORDER = ["Hero", "Detail", "Context"] as const;
type TierKey = (typeof TIER_ORDER)[number];

// How many rows to show before the "Show all" button is offered.
const INITIAL_ROW_LIMIT = 6;

export default function ProjectTable({ rows }: ProjectTableProps) {
  const [activeTier, setActiveTier] = useState<TierKey | "All">("All");
  const [expanded, setExpanded] = useState(false);

  // Count rows per tier for the chip labels.
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const tier of TIER_ORDER) c[tier] = 0;
    for (const row of rows) {
      const t = row.tier && TIER_ORDER.includes(row.tier as TierKey) ? row.tier : "Context";
      c[t] = (c[t] || 0) + 1;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (activeTier === "All") return rows;
    return rows.filter((r) => (r.tier || "Context") === activeTier);
  }, [rows, activeTier]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_ROW_LIMIT);
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="project-table">
      <div className="project-table-controls" role="toolbar" aria-label="Filter projects by tier">
        {(["All", ...TIER_ORDER] as const).map((tier) => {
          const count = counts[tier] ?? 0;
          const disabled = tier !== "All" && count === 0;
          const active = activeTier === tier;
          return (
            <button
              key={tier}
              onClick={() => {
                if (disabled) return;
                setActiveTier(tier);
                setExpanded(false);
              }}
              disabled={disabled}
              className={`project-chip ${active ? "project-chip-active" : ""} ${disabled ? "project-chip-disabled" : ""}`}
              aria-pressed={active}
            >
              <span>{tier}</span>
              <span className="project-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="project-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Client</th>
              <th scope="col">Year</th>
              <th scope="col">Industry</th>
              <th scope="col">Project Type</th>
              <th scope="col">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={`${r.client}-${r.year}-${i}`}>
                <td>
                  <div className="project-client">
                    <span>{r.client}</span>
                    {r.tier && (
                      <span className={`project-tier-badge project-tier-${r.tier.toLowerCase()}`}>
                        {r.tier}
                      </span>
                    )}
                  </div>
                </td>
                <td className="project-year">{r.year || "—"}</td>
                <td>
                  {r.industry}
                  {r.sector ? (
                    <span className="project-sector"> · {r.sector}</span>
                  ) : null}
                </td>
                <td>{r.projectType || "—"}</td>
                <td className="project-outcome">{r.outcome || "—"}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="project-empty">
                  No projects match that filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="project-expand"
        >
          Show all {filtered.length} {activeTier === "All" ? "projects" : activeTier.toLowerCase() + " projects"}
        </button>
      )}
      {expanded && filtered.length > INITIAL_ROW_LIMIT && (
        <button
          onClick={() => setExpanded(false)}
          className="project-expand project-expand-collapse"
        >
          Collapse
        </button>
      )}
    </div>
  );
}
