export const NAVY = "#0D1B3E";
export const GOLD = "#C9A84C";

export const BUDGET_CATEGORIES = [
  { key: "housing",      label: "Housing & Rent",           icon: "🏠", color: "#3B82F6", defaultPct: 35 },
  { key: "social",       label: "Social Events",            icon: "🎉", color: "#8B5CF6", defaultPct: 20 },
  { key: "rush",         label: "Rush & Recruitment",       icon: "🤝", color: "#EC4899", defaultPct: 15 },
  { key: "philanthropy", label: "Philanthropy",             icon: "❤️",  color: "#EF4444", defaultPct: 8  },
  { key: "operations",   label: "Operations & Admin",       icon: "⚙️",  color: "#F59E0B", defaultPct: 8  },
  { key: "nationals",    label: "Nationals Loan Repayment", icon: "📋", color: "#6366F1", defaultPct: 7  },
  { key: "reserve",      label: "Reserve / Emergency Fund", icon: "🛡️",  color: "#10B981", defaultPct: 7  },
] as const;

export const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
export type ClassYear = typeof CLASS_YEARS[number];

export const DEFAULT_DUES: Record<ClassYear, number> = {
  Senior: 500, Junior: 800, Sophomore: 1000, Freshman: 1300,
};

export const DEFAULT_COUNTS: Record<ClassYear, number> = {
  Senior: 5, Junior: 15, Sophomore: 15, Freshman: 20,
};

export const PAYMENT_METHODS = ["venmo", "zelle", "cash", "check", "bank_transfer", "other"] as const;
export const ROLES = ["member", "treasurer", "chapter_admin", "national_admin"] as const;
export type Role = typeof ROLES[number];

export const fmt = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
