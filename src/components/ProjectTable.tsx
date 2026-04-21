"use client";

import { useMemo, useState } from "react";
import type { ProjectRow } from "@/lib/types";

interface ProjectTableProps {
  rows: ProjectRow[];
  /** Which tab to open with. The server decides based on the user's query
   *  wording — explicit asks like "all projects" / "complete portfolio"
   *  land on "all", everything else defaults to "top". */
  defaultView?: "all" | "top";
}

// Two-tab filter for recruiters. The internal Hero / Detail / Context
// tiers still drive sort order on the server (Hero first, then Detail,
// then Context), but those internal labels are never exposed to users —
// "Top Projects" surfaces Hero only, "All Projects" shows everything.
// Order reflects the scan pattern: most recruiters want the short list
// first, then can click into the full table.
const TABS = [
  { key: "top", label: "Top Projects" },
  { key: "all", label: "All Projects" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// How many rows to show before the "Show all" button is offered.
const INITIAL_ROW_LIMIT = 6;

export default function ProjectTable({
  rows,
  defaultView = "top",
}: ProjectTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultView);
  const [expanded, setExpanded] = useState(false);

  const counts = useMemo(
    () => ({
      all: rows.length,
      top: rows.filter((r) => r.tier === "Hero").length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    if (activeTab === "top") return rows.filter((r) => r.tier === "Hero");
    return rows;
  }, [rows, activeTab]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_ROW_LIMIT);
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="project-table">
      <div
        className="project-table-controls"
        role="tablist"
        aria-label="Project view"
      >
        {TABS.map((tab) => {
          const count = counts[tab.key];
          const disabled = count === 0;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                setActiveTab(tab.key);
                setExpanded(false);
              }}
              className={`project-chip ${active ? "project-chip-active" : ""} ${disabled ? "project-chip-disabled" : ""}`}
            >
              <span>{tab.label}</span>
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
              <th scope="col">Project Type</th>
              <th scope="col">Industry</th>
              <th scope="col">Core Question</th>
              <th scope="col">Outcome</th>
              <th scope="col">Year</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={`${r.client}-${r.year}-${i}`}>
                <td>{r.client}</td>
                <td>{r.projectType || "—"}</td>
                <td>
                  {r.industry}
                  {r.sector ? (
                    <span className="project-sector"> · {r.sector}</span>
                  ) : null}
                </td>
                <td className="project-core-question">
                  {r.coreQuestion || "—"}
                </td>
                <td className="project-outcome">{r.outcome || "—"}</td>
                <td className="project-year">{r.year || "—"}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="project-empty">
                  No projects to show.
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
          Show all {filtered.length}{" "}
          {activeTab === "top" ? "top projects" : "projects"}
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
