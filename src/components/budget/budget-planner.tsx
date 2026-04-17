"use client";
import { useState, useMemo } from "react";
import { saveBudget, publishBudget } from "@/lib/actions/budget";
import { BUDGET_CATEGORIES, fmt } from "@/lib/constants";

const GOLD = "#C9A84C", GOLD_LIGHT = "#F0D080", DARK = "#0A0F1E";
const SURFACE = "#111827", SURFACE2 = "#1a2235", MUTED = "#6B7280";
const TEXT = "#E5E7EB", RED = "#EF4444", GREEN = "#10B981";

type BudgetStatus = "draft" | "published" | "archived";

interface Props {
  initialData: {
    budget: {
      id: string; name: string; status: BudgetStatus;
      globalDuesIncrease: number; freshmanRangeMin: number; freshmanRangeMax: number;
    };
    allocations: { categoryKey: string; percentage: number; amountCents: number }[];
    schedules: { classYear: string; baseDuesCents: number; memberCount: number }[];
  };
}

export function BudgetPlanner({ initialData }: Props) {
  const { budget, allocations, schedules } = initialData;
  const readOnly = budget.status === "published";

  const [name, setName] = useState(budget.name);
  const [increase, setIncrease] = useState(budget.globalDuesIncrease / 100);
  const [freshmanRange, setFreshmanRange] = useState([budget.freshmanRangeMin, budget.freshmanRangeMax]);
  const [dues, setDues] = useState<Record<string, number>>(
    Object.fromEntries(schedules.map(s => [s.classYear, s.baseDuesCents / 100]))
  );
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(schedules.map(s => [s.classYear, s.memberCount]))
  );
  const [budgetPcts, setBudgetPcts] = useState<Record<string, number>>(
    Object.fromEntries(allocations.map(a => [a.categoryKey, a.percentage]))
  );
  const [activeTab, setActiveTab] = useState("dues");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  const effectiveDues = useMemo(() =>
    Object.fromEntries(Object.entries(dues).map(([k, v]) => [k, v + increase])),
    [dues, increase]
  );

  const nonFreshmanRevenue = Object.entries(counts)
    .filter(([k]) => k !== "Freshman")
    .reduce((s, [k, n]) => s + n * (effectiveDues[k] || 0), 0);
  const freshmanMin = freshmanRange[0] * (effectiveDues.Freshman || 0);
  const freshmanMax = freshmanRange[1] * (effectiveDues.Freshman || 0);
  const totalMin = nonFreshmanRevenue + freshmanMin;
  const totalMax = nonFreshmanRevenue + freshmanMax;
  const totalEstimate = (totalMin + totalMax) / 2;
  const totalPct = Object.values(budgetPcts).reduce((a, b) => a + b, 0);

  const allocAmounts = useMemo(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map(c => [c.key, (budgetPcts[c.key] / 100) * totalEstimate])),
    [budgetPcts, totalEstimate]
  );

  async function handleSave() {
    setSaving(true);
    const result = await saveBudget(budget.id, {
      name, globalDuesIncrease: increase, freshmanRangeMin: freshmanRange[0],
      freshmanRangeMax: freshmanRange[1],
      dues: Object.fromEntries(Object.entries(dues).map(([k, v]) => [k, { baseCents: v * 100, memberCount: counts[k] || 0 }])),
      allocations: budgetPcts,
      totalEstimatedRevenue: Math.round(totalEstimate * 100),
    });
    setMessage(result.error ? `Error: ${result.error}` : "Saved!");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handlePublish() {
    if (!confirm("Publish this budget? This will generate invoices for all active members and cannot be undone.")) return;
    setPublishing(true);
    const result = await publishBudget(budget.id);
    if (result.error) { setMessage(`Error: ${result.error}`); setPublishing(false); return; }
    setMessage(`Published! ${result.invoicesGenerated} invoices generated.`);
    setPublishing(false);
  }

  const tabs = ["dues", "members", "budget", "summary"];

  return (
    <div style={{ color: TEXT, fontFamily: "'Georgia', serif", maxWidth: 780 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #0D1B3E 0%, #1a2d5a 100%)`, borderBottom: `2px solid ${GOLD}`, padding: "20px 24px", borderRadius: "12px 12px 0 0", marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: GOLD, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold", color: "#0D1B3E" }}>ΔΚΕ</div>
            <div>
              {readOnly ? (
                <div style={{ fontSize: 18, fontWeight: "bold", color: GOLD_LIGHT }}>{name}</div>
              ) : (
                <input value={name} onChange={e => setName(e.target.value)}
                  style={{ fontSize: 18, fontWeight: "bold", color: GOLD_LIGHT, background: "transparent", border: "none", outline: "none", width: 300 }} />
              )}
              <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase" }}>
                Semester Dues & Budget Planner
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {message && <span style={{ fontSize: 12, color: message.startsWith("Error") ? RED : GREEN }}>{message}</span>}
            <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: budget.status === "published" ? `${GREEN}22` : `${GOLD}22`, color: budget.status === "published" ? GREEN : GOLD, border: `1px solid ${budget.status === "published" ? GREEN : GOLD}44` }}>
              {budget.status}
            </span>
            {!readOnly && (
              <>
                <button onClick={handleSave} disabled={saving} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${GOLD}44`, background: "transparent", color: GOLD, cursor: "pointer", fontSize: 12 }}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button onClick={handlePublish} disabled={publishing} style={{ padding: "6px 14px", borderRadius: 6, background: GOLD, color: "#0D1B3E", cursor: "pointer", fontSize: 12, fontWeight: "bold", border: "none" }}>
                  {publishing ? "Publishing…" : "Publish"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revenue bar */}
      <div style={{ background: SURFACE, borderBottom: `1px solid #1F2937`, padding: "12px 24px", display: "flex", gap: 28, flexWrap: "wrap" }}>
        {[
          { label: "Mid estimate", val: `$${Math.round(totalEstimate).toLocaleString()}`, highlight: true },
          { label: "Low", val: `$${Math.round(totalMin).toLocaleString()}`, highlight: false },
          { label: "High", val: `$${Math.round(totalMax).toLocaleString()}`, highlight: false },
          { label: "Allocated", val: `${totalPct}%`, warn: totalPct > 100, highlight: totalPct !== 100 },
        ].map(({ label, val, highlight, warn }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: warn ? RED : highlight ? GOLD : TEXT }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: SURFACE }}>
        <div style={{ display: "flex", borderBottom: `1px solid #1F2937`, padding: "0 24px" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "12px 18px", border: "none", background: "transparent",
              color: activeTab === t ? GOLD : MUTED, borderBottom: activeTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
              cursor: "pointer", fontSize: 12, fontFamily: "Georgia, serif", letterSpacing: 0.5, marginBottom: -1, textTransform: "capitalize"
            }}>{t === "dues" ? "Dues Setup" : t === "members" ? "Member Counts" : t === "budget" ? "Budget Allocations" : "Full Summary"}</button>
          ))}
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* DUES TAB */}
          {activeTab === "dues" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: GOLD_LIGHT, marginBottom: 8, fontWeight: "bold" }}>Global dues increase</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {[0, 100, 200].map(amt => (
                    <button key={amt} onClick={() => !readOnly && setIncrease(amt)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${increase === amt ? GOLD : "#374151"}`, background: increase === amt ? `${GOLD}22` : "transparent", color: increase === amt ? GOLD : MUTED, cursor: readOnly ? "default" : "pointer", fontSize: 12 }}>
                      {amt === 0 ? "No increase" : `+$${amt}`}
                    </button>
                  ))}
                  {!readOnly && (
                    <input type="number" value={increase} onChange={e => setIncrease(Number(e.target.value))}
                      style={{ width: 70, background: SURFACE2, border: `1px solid #374151`, borderRadius: 4, color: TEXT, padding: "4px 8px", fontSize: 12 }} />
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(dues).map(([year, base]) => (
                  <div key={year} style={{ background: "#0f1623", border: `1px solid #1F2937`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 85, fontSize: 13, color: GOLD_LIGHT, fontWeight: "bold" }}>{year}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Base dues</div>
                      {readOnly ? (
                        <div style={{ fontSize: 14, color: TEXT }}>${base.toLocaleString()}</div>
                      ) : (
                        <input type="number" value={base} onChange={e => setDues(prev => ({ ...prev, [year]: Number(e.target.value) }))}
                          style={{ width: 90, background: SURFACE2, border: `1px solid #374151`, borderRadius: 4, color: TEXT, padding: "5px 8px", fontSize: 13 }} />
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: MUTED }}>Effective</div>
                      <div style={{ fontSize: 18, color: GOLD, fontWeight: "bold" }}>${(base + increase).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <div style={{ maxWidth: 560 }}>
              {Object.entries(counts).map(([year, n]) => year === "Freshman" ? (
                <div key={year} style={{ background: "#0f1623", border: `1px solid ${GOLD}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
                  <div style={{ fontWeight: "bold", color: GOLD_LIGHT, fontSize: 13, marginBottom: 10 }}>Freshman (rush class range)</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[0, 1].map(i => (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>{i === 0 ? "Min" : "Max"}</div>
                        <input type="range" min={5} max={40} value={freshmanRange[i]}
                          onChange={e => {
                            if (readOnly) return;
                            const v = Number(e.target.value);
                            setFreshmanRange(prev => i === 0 ? [Math.min(v, prev[1]), prev[1]] : [prev[0], Math.max(v, prev[0])]);
                          }}
                          style={{ width: "100%", accentColor: GOLD }} />
                        <div style={{ fontSize: 11, color: TEXT, textAlign: "center" }}>{freshmanRange[i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div key={year} style={{ background: "#0f1623", border: `1px solid #1F2937`, borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 85, fontSize: 13, color: GOLD_LIGHT, fontWeight: "bold" }}>{year}</div>
                  <div style={{ flex: 1 }}>
                    <input type="range" min={0} max={30} value={n} disabled={readOnly}
                      onChange={e => setCounts(prev => ({ ...prev, [year]: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: GOLD }} />
                  </div>
                  <input type="number" value={n} min={0} max={50} disabled={readOnly}
                    onChange={e => setCounts(prev => ({ ...prev, [year]: Number(e.target.value) }))}
                    style={{ width: 50, background: SURFACE2, border: `1px solid #374151`, borderRadius: 4, color: TEXT, padding: "5px", fontSize: 13, textAlign: "center" }} />
                  <div style={{ width: 90, textAlign: "right", fontSize: 13, color: TEXT }}>
                    {fmt(n * (effectiveDues[year] || 0) * 100)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUDGET TAB */}
          {activeTab === "budget" && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 12, color: MUTED }}>Allocate {fmt(Math.round(totalEstimate) * 100)} across categories. Must sum to 100%.</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: "bold", background: Math.abs(totalPct - 100) < 1 ? `${GREEN}22` : `${RED}22`, color: Math.abs(totalPct - 100) < 1 ? GREEN : RED, border: `1px solid ${Math.abs(totalPct - 100) < 1 ? GREEN : RED}44` }}>
                    {totalPct}% {totalPct > 100 ? `(+${totalPct - 100}% over)` : totalPct < 100 ? `(${100 - totalPct}% left)` : "✓"}
                  </div>
                  {!readOnly && (
                    <button onClick={() => {
                      const total = Object.values(budgetPcts).reduce((a, b) => a + b, 0);
                      if (total === 0) return;
                      setBudgetPcts(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, Math.round(v / total * 100)])));
                    }} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid #374151`, background: "transparent", color: MUTED, cursor: "pointer", fontSize: 11 }}>
                      Auto-normalize
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BUDGET_CATEGORIES.map(cat => (
                  <div key={cat.key} style={{ background: "#0f1623", border: `1px solid #1F2937`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 18, width: 26 }}>{cat.icon}</div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 12, color: TEXT, fontWeight: "bold" }}>{cat.label}</div>
                      <div style={{ fontSize: 16, color: cat.color, fontWeight: "bold" }}>{fmt(Math.round(allocAmounts[cat.key]) * 100)}</div>
                    </div>
                    <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="range" min={0} max={60} value={budgetPcts[cat.key] || 0} disabled={readOnly}
                        onChange={e => setBudgetPcts(prev => ({ ...prev, [cat.key]: Number(e.target.value) }))}
                        style={{ flex: 1, accentColor: cat.color }} />
                      <input type="number" value={budgetPcts[cat.key] || 0} min={0} max={100} disabled={readOnly}
                        onChange={e => setBudgetPcts(prev => ({ ...prev, [cat.key]: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                        style={{ width: 44, background: SURFACE2, border: `1px solid #374151`, borderRadius: 4, color: TEXT, padding: "3px 5px", fontSize: 12, textAlign: "center" }} />
                      <span style={{ fontSize: 11, color: MUTED }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUMMARY TAB */}
          {activeTab === "summary" && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: GOLD_LIGHT, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Dues Revenue</div>
                <div style={{ background: "#0f1623", borderRadius: 10, overflow: "hidden", border: `1px solid #1F2937` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: "#0D1B3E99", padding: "8px 14px" }}>
                    {["Year", "Members", "Dues", "Total"].map(h => (
                      <div key={h} style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>{h}</div>
                    ))}
                  </div>
                  {Object.entries(dues).map(([year, base], i) => {
                    const n = year === "Freshman" ? Math.round((freshmanRange[0] + freshmanRange[1]) / 2) : counts[year] || 0;
                    const effective = base + increase;
                    return (
                      <div key={year} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 14px", background: i % 2 === 0 ? "transparent" : `${SURFACE2}66`, borderTop: `1px solid #1F2937` }}>
                        <div style={{ color: GOLD_LIGHT, fontWeight: "bold", fontSize: 13 }}>{year}</div>
                        <div style={{ color: TEXT, fontSize: 13 }}>{n}</div>
                        <div style={{ color: TEXT, fontSize: 13 }}>${effective.toLocaleString()}</div>
                        <div style={{ color: GOLD, fontWeight: "bold", fontSize: 13 }}>${(n * effective).toLocaleString()}</div>
                      </div>
                    );
                  })}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 14px", background: `${GOLD}11`, borderTop: `2px solid ${GOLD}44` }}>
                    <div style={{ color: GOLD, fontWeight: "bold", gridColumn: "1/4", fontSize: 13 }}>Mid-estimate total</div>
                    <div style={{ color: GOLD, fontWeight: "bold", fontSize: 15 }}>${Math.round(totalEstimate).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: GOLD_LIGHT, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Budget Allocations</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {BUDGET_CATEGORIES.map(cat => (
                    <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#0f1623", borderRadius: 8, border: `1px solid #1F2937` }}>
                      <span style={{ fontSize: 15 }}>{cat.icon}</span>
                      <span style={{ flex: 1, fontSize: 12, color: TEXT }}>{cat.label}</span>
                      <span style={{ color: MUTED, fontSize: 12 }}>{budgetPcts[cat.key]}%</span>
                      <span style={{ color: cat.color, fontWeight: "bold", fontSize: 13, width: 90, textAlign: "right" }}>{fmt(Math.round(allocAmounts[cat.key]) * 100)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
