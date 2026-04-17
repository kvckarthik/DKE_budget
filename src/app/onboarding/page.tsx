"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChapter, joinChapter } from "@/lib/actions/chapters";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createChapter({
      name: fd.get("name") as string,
      school: fd.get("school") as string,
      dkeDesignation: fd.get("dkeDesignation") as string,
    });
    if (result.error) { setError(result.error); setLoading(false); return; }
    router.push("/dashboard");
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await joinChapter(fd.get("inviteCode") as string);
    if (result.error) { setError(result.error); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0D1B3E 0%, #0A0F1E 100%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl font-bold"
            style={{ background: "#C9A84C", color: "#0D1B3E", fontFamily: "Georgia, serif" }}>ΔΚΕ</div>
          <h1 className="text-2xl font-bold" style={{ color: "#C9A84C" }}>Welcome to DKE Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your chapter to get started</p>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <button onClick={() => setMode("create")}
              className="w-full p-4 rounded-xl border text-left transition-colors hover:bg-white/5"
              style={{ borderColor: "#C9A84C44" }}>
              <div className="font-semibold" style={{ color: "#C9A84C" }}>Create a new chapter</div>
              <div className="text-xs text-muted-foreground mt-1">You&apos;re setting up DKE Platform for your chapter</div>
            </button>
            <button onClick={() => setMode("join")}
              className="w-full p-4 rounded-xl border text-left transition-colors hover:bg-white/5 border-white/10">
              <div className="font-semibold">Join an existing chapter</div>
              <div className="text-xs text-muted-foreground mt-1">Your treasurer shared an invite code with you</div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <button type="button" onClick={() => setMode("choose")}
              className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
            {[
              { name: "name", label: "Chapter Name", placeholder: "e.g. DKE Sigma Chapter" },
              { name: "school", label: "School / University", placeholder: "e.g. University of Michigan" },
              { name: "dkeDesignation", label: "DKE Designation (optional)", placeholder: "e.g. Sigma" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input name={name} placeholder={placeholder} required={name !== "dkeDesignation"}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-yellow-500/50" />
              </div>
            ))}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
              style={{ background: "#C9A84C", color: "#0D1B3E" }}>
              {loading ? "Creating…" : "Create Chapter"}
            </button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <button type="button" onClick={() => setMode("choose")}
              className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
            <div>
              <label className="block text-sm font-medium mb-1">Invite Code</label>
              <input name="inviteCode" placeholder="Enter 8-character invite code"
                required maxLength={8}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-yellow-500/50 uppercase tracking-widest" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
              style={{ background: "#C9A84C", color: "#0D1B3E" }}>
              {loading ? "Joining…" : "Join Chapter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
