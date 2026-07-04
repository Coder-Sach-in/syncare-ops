import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hospital, LogIn, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HealthSync AI" },
      { name: "description", content: "Sign in to the HealthSync AI healthcare portal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/app" });
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft via-background to-accent-soft grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-[var(--shadow-elevated)]">
            <Hospital className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">HealthSync AI</h1>
          <p className="text-sm text-muted-foreground">PHC / CHC Staff Portal · Ujjain District</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-elevated)] space-y-4">
          <h2 className="font-bold text-lg">Sign in</h2>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@healthsync.ai" autoComplete="email"
              className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Password</label>
            <div className="relative mt-1">
              <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-11 px-3 pr-10 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <div className="rounded-lg bg-destructive-soft text-destructive text-sm px-3 py-2">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition disabled:opacity-60">
            <LogIn className="h-5 w-5" /> {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-card border border-border p-4 text-xs">
          <div className="font-bold mb-2">Demo accounts <span className="text-muted-foreground font-normal">(password: <code className="bg-muted px-1 rounded">HealthSync@2026</code>)</span></div>
          <div className="grid grid-cols-1 gap-1.5">
            <button type="button" onClick={() => fillDemo("admin@healthsync.ai")} className="text-left px-2 py-1.5 rounded-lg hover:bg-primary-soft transition">
              <span className="font-semibold text-primary">admin@healthsync.ai</span> — District Admin
            </button>
            {[
              ["ghatia.chc@healthsync.ai", "Ghatia CHC"],
              ["tarana.chc@healthsync.ai", "Tarana CHC"],
              ["jharda.chc@healthsync.ai", "Jharda CHC"],
              ["narwar.chc@healthsync.ai", "Narwar CHC"],
              ["unhel.phc@healthsync.ai", "Unhel PHC"],
            ].map(([em, name]) => (
              <button key={em} type="button" onClick={() => fillDemo(em)} className="text-left px-2 py-1.5 rounded-lg hover:bg-primary-soft transition">
                <span className="font-semibold text-primary">{em}</span> — {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
