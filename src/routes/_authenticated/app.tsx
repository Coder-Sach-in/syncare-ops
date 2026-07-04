import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Bell, Hospital, Wifi, Mic, MicOff, Minus, Plus, Search,
  LayoutDashboard, Package, Users, BedDouble, TestTube, Settings,
  LogIn, LogOut, CheckCircle2, XCircle, Pill, Activity, PlusCircle,
  AlertTriangle, ArrowLeft, FlaskConical, Building2, ShieldCheck,
  KeyRound, Send, Copy, Check, ClipboardList, Pencil, Trash2, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminResetPassword, adminCreateCenter, adminListStaff } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "HealthSync AI — Portal" },
      { name: "description", content: "Ground-level healthcare portal for PHC/CHC staff." },
    ],
  }),
  component: AppPage,
});

/* ---------------- Types ---------------- */
type Center = { id: string; center_name: string; center_type: "PHC" | "CHC"; district: string };
type Profile = { id: string; center_id: string | null; full_name: string };
type Role = "district_admin" | "center_staff";
type Med = { id: string; name: string; stock: number; center_id: string };
type StaffRow = { id: string; name: string; role: string; status: "in" | "out" | "idle"; last_marked_at: string | null; center_id: string };
type BedRow = { id: string; name: string; count: number; available: boolean; center_id: string };
type TestRow = { id: string; name: string; available: boolean; center_id: string };
type PathRow = { id: string; center_id: string; test_name: string; sample_status: "Collected" | "Pending"; report_status: "Ready" | "Pending"; turnaround_time_hours: number };
type ReqRow = { id: string; center_id: string; item_type: string; item_name: string; quantity_requested: number; status: "Pending" | "Approved" | "Rejected" | "Dispatched"; requested_at: string; resolved_at: string | null };

/* ---------------- Auth session hook ---------------- */
function useSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [center, setCenter] = useState<Center | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { setLoading(false); return; }
      setEmail(user.email ?? "");
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
      ]);
      setProfile(p as Profile | null);
      setRole((r?.role ?? null) as Role | null);
      if (p?.center_id) {
        const { data: c } = await supabase.from("centers").select("*").eq("id", p.center_id).maybeSingle();
        setCenter(c as Center | null);
      }
      setLoading(false);
    })();
  }, []);

  return { profile, role, center, email, loading };
}

/* ---------------- Header ---------------- */
function Header({ centerName, role, email, onSignOut }: { centerName: string; role: Role | null; email: string; onSignOut: () => void }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const date = now ? now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";
  const time = now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
  const initials = (email || "?").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-[var(--shadow-elevated)]">
            <Hospital className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold leading-tight truncate">HealthSync AI</h1>
            <p className="text-[11px] md:text-xs text-muted-foreground truncate">{role === "district_admin" ? "District Admin Portal" : "PHC / CHC Staff Portal"}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-border text-sm">
          <div><div className="text-xs text-muted-foreground">Date</div><div className="font-semibold" suppressHydrationWarning>{date}</div></div>
          <div><div className="text-xs text-muted-foreground">Time</div><div className="font-semibold tabular-nums" suppressHydrationWarning>{time}</div></div>
          <div><div className="text-xs text-muted-foreground">{role === "district_admin" ? "Scope" : "Center"}</div><div className="font-semibold">{centerName}</div></div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-accent-soft text-accent px-3 py-1.5 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <Wifi className="h-3.5 w-3.5" /> Online
          </span>
          <button className="relative h-10 w-10 grid place-items-center rounded-full bg-muted hover:bg-secondary transition">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-white" />
          </button>
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">{initials}</div>
          <button onClick={onSignOut} title="Sign out" className="h-10 px-3 rounded-full bg-destructive-soft text-destructive font-semibold text-xs hover:bg-destructive hover:text-destructive-foreground transition inline-flex items-center gap-1">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      <div className="md:hidden mx-auto max-w-7xl px-4 pb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span suppressHydrationWarning>{date}</span>
        <span className="tabular-nums font-semibold text-foreground" suppressHydrationWarning>{time}</span>
        <span className="truncate">{centerName}</span>
      </div>
    </header>
  );
}

/* ---------------- Building blocks ---------------- */
function Section({ title, subtitle, icon: Icon, children, id, actions }: { title: string; subtitle?: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; id?: string; actions?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start md:items-center justify-between gap-3 mb-4 flex-col md:flex-row">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><Icon className="h-5 w-5" /></div>
          <div><h2 className="text-lg md:text-xl font-bold">{title}</h2>{subtitle && <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>}</div>
        </div>
        {actions && <div className="w-full md:w-auto">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
function SubCard({ title, tone = "default", icon: Icon, children }: { title: string; tone?: "default" | "alert" | "update"; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  const styles = tone === "alert" ? "border-destructive/30 bg-destructive-soft/40" : tone === "update" ? "border-primary/20 bg-primary-soft/30" : "border-border bg-card";
  const chip = tone === "alert" ? "bg-destructive text-destructive-foreground" : tone === "update" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground";
  return (
    <div className={`rounded-2xl border ${styles} p-4 md:p-5 shadow-[var(--shadow-card)]`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-8 w-8 rounded-lg grid place-items-center ${chip}`}><Icon className="h-4 w-4" /></span>
        <h3 className="font-bold text-sm md:text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-11 pl-10 pr-3 rounded-xl border border-border bg-white text-sm shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">{msg}</div>;
}
function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-2">
      <ArrowLeft className="h-4 w-4" /> Back to Dashboard · <span className="text-muted-foreground font-medium">{label}</span>
    </button>
  );
}
function ReadOnlyBanner() {
  return (
    <div className="rounded-xl border border-amber-300/50 bg-amber-100/60 text-amber-900 px-3 py-2 text-xs font-semibold flex items-center gap-2 mb-3">
      <ShieldCheck className="h-4 w-4" /> Admin view — read only across all centers.
    </div>
  );
}

/* ================================================================
   MEDICINE
   ================================================================ */
function MedicineView({ meds, refresh, onBack, canEdit, centerId, onRequest }: {
  meds: Med[]; refresh: () => void; onBack: () => void; canEdit: boolean; centerId: string | null;
  onRequest: () => void;
}) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const lowMeds = meds.filter((m) => m.stock <= 20);
  const filtered = useMemo(() => meds.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase())), [meds, query]);

  const change = async (id: string, cur: number, delta: number) => {
    const next = Math.max(0, cur + delta);
    await supabase.from("stock").update({ stock: next }).eq("id", id);
    refresh();
  };
  const addMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !centerId) return;
    const name = newName.trim();
    const stock = Math.max(0, parseInt(newStock || "0", 10) || 0);
    if (!name) return;
    const { error } = await supabase.from("stock").insert({ name, stock, center_id: centerId });
    if (error) { setFlash(error.message); setTimeout(() => setFlash(null), 2500); return; }
    setNewName(""); setNewStock(""); setFlash(`${name} added`); setTimeout(() => setFlash(null), 2000);
    refresh();
  };

  return (
    <div className="space-y-5">
      <BackBar label="Medicine Stock" onBack={onBack} />
      <Section id="stock" title="Medicine Stock" subtitle="Alerts first, then update or add new" icon={Pill}
        actions={canEdit ? (
          <button onClick={onRequest} className="h-11 px-4 rounded-xl bg-accent text-accent-foreground font-semibold text-sm inline-flex items-center gap-2 hover:brightness-110 active:scale-95 transition">
            <Send className="h-4 w-4" /> Request Stock
          </button>
        ) : null}>
        <div className="space-y-5">
          {!canEdit && <ReadOnlyBanner />}
          <SubCard title={`Low Stock Alerts (${lowMeds.length})`} tone="alert" icon={AlertTriangle}>
            {lowMeds.length === 0 ? <p className="text-sm text-muted-foreground">All medicines are healthy. No refill needed right now.</p> : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lowMeds.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-xl bg-white border border-destructive/20 px-3 py-2">
                    <span className="flex items-center gap-2 font-semibold text-sm"><Pill className="h-4 w-4 text-destructive" /> {m.name}</span>
                    <span className="text-sm font-bold text-destructive tabular-nums">{m.stock} left</span>
                  </li>
                ))}
              </ul>
            )}
          </SubCard>

          <SubCard title={canEdit ? "Update Stock & Add New Medicine" : "Medicines"} tone="update" icon={PlusCircle}>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <SearchBox value={query} onChange={setQuery} placeholder="Search medicine by name..." />
              {canEdit && (
                <form onSubmit={addMed} className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New medicine name"
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="Qty" inputMode="numeric"
                    className="h-11 w-full sm:w-24 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
                    <PlusCircle className="h-5 w-5" /> Add
                  </button>
                </form>
              )}
            </div>
            {flash && <div className="text-xs font-semibold text-primary mb-2">{flash}</div>}
            {filtered.length === 0 ? <Empty msg={`No medicine matches "${query}"`} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filtered.map((m) => {
                  const low = m.stock <= 20;
                  return (
                    <div key={m.id} className="rounded-2xl bg-white border border-border p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-primary-soft grid place-items-center"><Pill className="h-5 w-5 text-primary" /></div>
                          <div>
                            <div className="font-semibold">{m.name}</div>
                            <div className={`text-xs font-medium ${low ? "text-destructive" : "text-muted-foreground"}`}>{low ? "Low stock" : "In stock"}</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold tabular-nums">{m.stock}</div>
                      </div>
                      {canEdit && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button onClick={() => change(m.id, m.stock, -1)} className="h-12 rounded-xl bg-destructive-soft text-destructive font-bold grid place-items-center hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition"><Minus className="h-6 w-6" /></button>
                          <button onClick={() => change(m.id, m.stock, 1)} className="h-12 rounded-xl bg-accent-soft text-accent font-bold grid place-items-center hover:bg-accent hover:text-accent-foreground active:scale-95 transition"><Plus className="h-6 w-6" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SubCard>

          {canEdit && (
            <SubCard title="Voice Stock Update" tone="default" icon={Mic}>
              <VoiceStock meds={meds} refresh={refresh} />
            </SubCard>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ---------- Voice ---------- */
type SR = any;
function VoiceStock({ meds, refresh }: { meds: Med[]; refresh: () => void }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SR | null>(null);
  const medsRef = useRef(meds);
  useEffect(() => { medsRef.current = meds; }, [meds]);
  useEffect(() => {
    const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRC) { setSupported(false); return; }
    const rec = new SRC(); rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setText(t); if (e.results[e.results.length - 1].isFinal) parseCommand(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setStatus({ ok: false, msg: "Voice error — try again." }); };
    recRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const numberWords: Record<string, number> = { zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,fifty:50,hundred:100 };
  async function parseCommand(raw: string) {
    const t = raw.toLowerCase().trim();
    const med = medsRef.current.find((m) => t.includes(m.name.toLowerCase()));
    if (!med) { setStatus({ ok: false, msg: "Medicine not recognized." }); return; }
    const sign = /(minus|subtract|remove|less)/.test(t) ? -1 : /(plus|add|increase|more)/.test(t) ? 1 : 0;
    if (!sign) { setStatus({ ok: false, msg: "Say 'plus' or 'minus' with a number." }); return; }
    const numMatch = t.match(/\d+/);
    let n = numMatch ? parseInt(numMatch[0], 10) : NaN;
    if (isNaN(n)) { for (const w of Object.keys(numberWords)) if (t.includes(w)) { n = numberWords[w]; break; } }
    if (isNaN(n)) { setStatus({ ok: false, msg: "Number not recognized." }); return; }
    const next = Math.max(0, med.stock + sign * n);
    await supabase.from("stock").update({ stock: next }).eq("id", med.id);
    refresh();
    setStatus({ ok: true, msg: `${med.name} ${sign > 0 ? "+" : "−"}${n} — Stock updated successfully` });
  }
  const toggle = () => {
    if (!supported || !recRef.current) return;
    if (listening) { recRef.current.stop(); return; }
    setText(""); setStatus(null); setListening(true);
    try { recRef.current.start(); } catch { /* ignore */ }
  };
  return (
    <div className="flex flex-col items-center text-center">
      <button onClick={toggle} disabled={!supported}
        className={`relative h-24 w-24 md:h-28 md:w-28 rounded-full grid place-items-center transition-all active:scale-95 ${listening ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:brightness-110"} shadow-[var(--shadow-elevated)] disabled:opacity-50 disabled:cursor-not-allowed`}>
        {listening && <span className="absolute inset-0 rounded-full bg-destructive opacity-40 animate-ping" />}
        {listening ? <MicOff className="h-10 w-10 relative" /> : <Mic className="h-10 w-10 relative" />}
      </button>
      <div className="mt-3 text-sm font-semibold text-primary">{listening ? "Listening..." : supported ? "Tap the mic and speak" : "Voice not supported in this browser"}</div>
      <div className="mt-2 w-full max-w-lg rounded-xl bg-white border border-border px-4 py-3 min-h-[48px] text-sm text-foreground">
        {text || <span className="text-muted-foreground">Say e.g. "Paracetamol plus five", "ORS minus two"</span>}
      </div>
      {status && (
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.ok ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"}`}>
          {status.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {status.msg}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   ATTENDANCE
   ================================================================ */
function AttendanceView({ staff, refresh, onBack, canEdit, centerId }: { staff: StaffRow[]; refresh: () => void; onBack: () => void; canEdit: boolean; centerId: string | null }) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const notMarked = staff.filter((s) => s.status === "idle");
  const checkedOut = staff.filter((s) => s.status === "out");

  const set = async (id: string, status: "in" | "out") => {
    await supabase.from("attendance").update({ status, last_marked_at: new Date().toISOString() }).eq("id", id);
    refresh();
  };
  const filtered = staff.filter((s) => { const q = query.trim().toLowerCase(); return !q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q); });
  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !centerId) return;
    const name = newName.trim(); const role = newRole.trim() || "Staff";
    if (!name) return;
    await supabase.from("attendance").insert({ name, role, status: "idle", center_id: centerId });
    setNewName(""); setNewRole(""); refresh();
  };
  const initials = (n: string) => n.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const timeOf = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="space-y-5">
      <BackBar label="Staff Attendance" onBack={onBack} />
      <Section id="attendance" title="Doctor & Nurse Attendance" subtitle="Alerts first, then mark or add staff" icon={Users}>
        <div className="space-y-5">
          {!canEdit && <ReadOnlyBanner />}
          <SubCard title={`Attention Needed (${notMarked.length + checkedOut.length})`} tone="alert" icon={AlertTriangle}>
            {notMarked.length + checkedOut.length === 0 ? <p className="text-sm text-muted-foreground">All staff are marked present. Great!</p> : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notMarked.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl bg-white border border-destructive/20 px-3 py-2 text-sm">
                    <span className="font-semibold">{s.name}</span><span className="text-xs font-bold text-muted-foreground">Not marked</span>
                  </li>
                ))}
                {checkedOut.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl bg-white border border-destructive/20 px-3 py-2 text-sm">
                    <span className="font-semibold">{s.name}</span><span className="text-xs font-bold text-destructive">Checked out{s.last_marked_at ? ` · ${timeOf(s.last_marked_at)}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </SubCard>

          <SubCard title={canEdit ? "Update Attendance & Add New Staff" : "Staff"} tone="update" icon={PlusCircle}>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <SearchBox value={query} onChange={setQuery} placeholder="Search by name or role..." />
              {canEdit && (
                <form onSubmit={addStaff} className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New staff name"
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role"
                    className="h-11 w-full sm:w-36 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
                    <PlusCircle className="h-5 w-5" /> Add
                  </button>
                </form>
              )}
            </div>
            {filtered.length === 0 ? <Empty msg={`No staff matches "${query}"`} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {filtered.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-white border border-border p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full grid place-items-center text-white font-bold text-lg bg-primary">{initials(s.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.role}</div>
                        <div className="mt-1 text-xs font-semibold">
                          {s.status === "in" && <span className="text-accent">🟢 Present {s.last_marked_at && `· ${timeOf(s.last_marked_at)}`}</span>}
                          {s.status === "out" && <span className="text-destructive">🔴 Checked Out {s.last_marked_at && `· ${timeOf(s.last_marked_at)}`}</span>}
                          {s.status === "idle" && <span className="text-muted-foreground">⚪ Not marked</span>}
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button onClick={() => set(s.id, "in")} className={`h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition ${s.status === "in" ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent hover:bg-accent hover:text-accent-foreground"}`}>
                          <LogIn className="h-5 w-5" /> Check In
                        </button>
                        <button onClick={() => set(s.id, "out")} className={`h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition ${s.status === "out" ? "bg-destructive text-destructive-foreground" : "bg-destructive-soft text-destructive hover:bg-destructive hover:text-destructive-foreground"}`}>
                          <LogOut className="h-5 w-5" /> Check Out
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubCard>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================
   BEDS
   ================================================================ */
function BedsView({ beds, refresh, onBack, canEdit, centerId }: { beds: BedRow[]; refresh: () => void; onBack: () => void; canEdit: boolean; centerId: string | null }) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newCount, setNewCount] = useState("");
  const alertBeds = beds.filter((b) => !b.available || b.count <= 2);
  const change = async (id: string, cur: number, delta: number) => { await supabase.from("beds").update({ count: Math.max(0, cur + delta) }).eq("id", id); refresh(); };
  const setAvail = async (id: string, val: boolean) => { await supabase.from("beds").update({ available: val }).eq("id", id); refresh(); };
  const filtered = beds.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase()));
  const addBed = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canEdit || !centerId) return;
    const name = newName.trim(); const count = Math.max(0, parseInt(newCount || "0", 10) || 0);
    if (!name) return;
    await supabase.from("beds").insert({ name, count, available: true, center_id: centerId });
    setNewName(""); setNewCount(""); refresh();
  };
  return (
    <div className="space-y-5">
      <BackBar label="Bed Availability" onBack={onBack} />
      <Section id="beds" title="Bed Availability" subtitle="Alerts first, then update or add wards" icon={BedDouble}>
        <div className="space-y-5">
          {!canEdit && <ReadOnlyBanner />}
          <SubCard title={`Ward Alerts (${alertBeds.length})`} tone="alert" icon={AlertTriangle}>
            {alertBeds.length === 0 ? <p className="text-sm text-muted-foreground">All wards have beds available.</p> : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alertBeds.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-xl bg-white border border-destructive/20 px-3 py-2 text-sm">
                    <span className="font-semibold">{b.name}</span>
                    <span className="text-xs font-bold text-destructive">{!b.available ? "Unavailable" : `Only ${b.count} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </SubCard>
          <SubCard title={canEdit ? "Update Beds & Add New Ward" : "Wards"} tone="update" icon={PlusCircle}>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <SearchBox value={query} onChange={setQuery} placeholder="Search bed type..." />
              {canEdit && (
                <form onSubmit={addBed} className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New ward name"
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input value={newCount} onChange={(e) => setNewCount(e.target.value)} placeholder="Beds" inputMode="numeric"
                    className="h-11 w-full sm:w-24 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
                    <PlusCircle className="h-5 w-5" /> Add
                  </button>
                </form>
              )}
            </div>
            {filtered.length === 0 ? <Empty msg={`No bed type matches "${query}"`} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {filtered.map((b) => (
                  <div key={b.id} className="rounded-2xl bg-white border border-border p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-10 w-10 rounded-xl grid place-items-center ${b.available ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"}`}><BedDouble className="h-5 w-5" /></div>
                      <div className="font-semibold">{b.name}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div><div className="text-3xl font-bold tabular-nums">{b.count}</div><div className="text-xs text-muted-foreground">available now</div></div>
                      {canEdit && (
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => change(b.id, b.count, 1)} className="h-9 w-9 rounded-lg bg-accent-soft text-accent grid place-items-center hover:bg-accent hover:text-accent-foreground transition"><Plus className="h-4 w-4" /></button>
                          <button onClick={() => change(b.id, b.count, -1)} className="h-9 w-9 rounded-lg bg-destructive-soft text-destructive grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition"><Minus className="h-4 w-4" /></button>
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
                        <button onClick={() => setAvail(b.id, true)} className={`h-10 rounded-lg text-sm font-semibold transition ${b.available ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"}`}>Available</button>
                        <button onClick={() => setAvail(b.id, false)} className={`h-10 rounded-lg text-sm font-semibold transition ${!b.available ? "bg-destructive text-destructive-foreground shadow" : "text-muted-foreground"}`}>Unavailable</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubCard>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================
   TESTS
   ================================================================ */
function LabTestsView({ tests, refresh, onBack, canEdit, centerId }: { tests: TestRow[]; refresh: () => void; onBack: () => void; canEdit: boolean; centerId: string | null }) {
  const [query, setQuery] = useState(""); const [newName, setNewName] = useState("");
  const unavail = tests.filter((t) => !t.available);
  const setAvail = async (id: string, val: boolean) => { await supabase.from("tests").update({ available: val }).eq("id", id); refresh(); };
  const filtered = tests.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));
  const addTest = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canEdit || !centerId) return;
    const name = newName.trim(); if (!name) return;
    await supabase.from("tests").insert({ name, available: true, center_id: centerId }); setNewName(""); refresh();
  };
  return (
    <div className="space-y-5">
      <BackBar label="Lab Tests" onBack={onBack} />
      <Section id="tests" title="Lab Tests" subtitle="Alerts first, then update or add tests" icon={TestTube}>
        <div className="space-y-5">
          {!canEdit && <ReadOnlyBanner />}
          <SubCard title={`Tests Unavailable (${unavail.length})`} tone="alert" icon={AlertTriangle}>
            {unavail.length === 0 ? <p className="text-sm text-muted-foreground">All tests are available today.</p> : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {unavail.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-xl bg-white border border-destructive/20 px-3 py-2 text-sm">
                    <span className="font-semibold">{t.name}</span><span className="text-xs font-bold text-destructive">Not available</span>
                  </li>
                ))}
              </ul>
            )}
          </SubCard>
          <SubCard title={canEdit ? "Update Tests & Add New Test" : "Tests"} tone="update" icon={PlusCircle}>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <SearchBox value={query} onChange={setQuery} placeholder="Search lab test..." />
              {canEdit && (
                <form onSubmit={addTest} className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New test name"
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
                    <PlusCircle className="h-5 w-5" /> Add
                  </button>
                </form>
              )}
            </div>
            {filtered.length === 0 ? <Empty msg={`No lab test matches "${query}"`} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filtered.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-white border border-border p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><TestTube className="h-5 w-5" /></div>
                        <div>
                          <div className="font-semibold">{t.name}</div>
                          <div className={`text-xs font-medium ${t.available ? "text-accent" : "text-destructive"}`}>{t.available ? "● Available today" : "● Not available"}</div>
                        </div>
                      </div>
                      <span className={`h-3 w-3 rounded-full ${t.available ? "bg-accent" : "bg-destructive"} shadow ring-4 ${t.available ? "ring-accent-soft" : "ring-destructive-soft"}`} />
                    </div>
                    {canEdit && (
                      <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
                        <button onClick={() => setAvail(t.id, true)} className={`h-10 rounded-lg text-sm font-semibold transition ${t.available ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"}`}>Available</button>
                        <button onClick={() => setAvail(t.id, false)} className={`h-10 rounded-lg text-sm font-semibold transition ${!t.available ? "bg-destructive text-destructive-foreground shadow" : "text-muted-foreground"}`}>Unavailable</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubCard>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================
   PATHOLOGY
   ================================================================ */
function PathologyView({ rows, refresh, onBack, canEdit, centerId }: { rows: PathRow[]; refresh: () => void; onBack: () => void; canEdit: boolean; centerId: string | null }) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newTat, setNewTat] = useState("");
  const pending = rows.filter((r) => r.report_status === "Pending" || r.turnaround_time_hours >= 24);
  const filtered = rows.filter((r) => r.test_name.toLowerCase().includes(query.trim().toLowerCase()));

  const upd = async (id: string, patch: Partial<PathRow>) => { await supabase.from("pathology_labs").update(patch).eq("id", id); refresh(); };
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!canEdit || !centerId) return;
    const test_name = newName.trim(); const tat = Math.max(1, parseInt(newTat || "24", 10) || 24);
    if (!test_name) return;
    await supabase.from("pathology_labs").insert({ test_name, sample_status: "Pending", report_status: "Pending", turnaround_time_hours: tat, center_id: centerId });
    setNewName(""); setNewTat(""); refresh();
  };

  return (
    <div className="space-y-5">
      <BackBar label="Pathology Lab" onBack={onBack} />
      <Section id="pathology" title="Pathology Lab" subtitle="Sample collection & report turnaround" icon={FlaskConical}>
        <div className="space-y-5">
          {!canEdit && <ReadOnlyBanner />}
          <SubCard title={`Reports Pending / Delayed (${pending.length})`} tone="alert" icon={AlertTriangle}>
            {pending.length === 0 ? <p className="text-sm text-muted-foreground">All pathology reports are ready. Great turnaround!</p> : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pending.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-xl bg-white border border-destructive/20 px-3 py-2 text-sm">
                    <span className="font-semibold flex items-center gap-2"><FlaskConical className="h-4 w-4 text-destructive" />{r.test_name}</span>
                    <span className="text-xs font-bold text-destructive">
                      {r.sample_status === "Pending" ? "Sample pending" : r.report_status === "Pending" ? `Report pending · ${r.turnaround_time_hours}h TAT` : `${r.turnaround_time_hours}h TAT`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SubCard>

          <SubCard title={canEdit ? "Update Pathology & Add New Test" : "Pathology Tests"} tone="update" icon={PlusCircle}>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <SearchBox value={query} onChange={setQuery} placeholder="Search pathology test..." />
              {canEdit && (
                <form onSubmit={add} className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New pathology test"
                    className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input value={newTat} onChange={(e) => setNewTat(e.target.value)} placeholder="TAT h" inputMode="numeric"
                    className="h-11 w-full sm:w-24 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
                    <PlusCircle className="h-5 w-5" /> Add
                  </button>
                </form>
              )}
            </div>

            {filtered.length === 0 ? <Empty msg={`No pathology test matches "${query}"`} /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filtered.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-white border border-border p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><FlaskConical className="h-5 w-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{r.test_name}</div>
                        <div className="text-xs text-muted-foreground">TAT: {r.turnaround_time_hours}h</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className={`px-2 py-1 rounded-full ${r.sample_status === "Collected" ? "bg-accent-soft text-accent" : "bg-amber-100 text-amber-700"}`}>Sample: {r.sample_status}</span>
                      <span className={`px-2 py-1 rounded-full ${r.report_status === "Ready" ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"}`}>Report: {r.report_status}</span>
                    </div>
                    {canEdit && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={() => upd(r.id, { sample_status: r.sample_status === "Collected" ? "Pending" : "Collected" })}
                          className="h-10 rounded-xl bg-primary-soft text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition">
                          Sample: {r.sample_status === "Collected" ? "Mark Pending" : "Mark Collected"}
                        </button>
                        <button onClick={() => upd(r.id, { report_status: r.report_status === "Ready" ? "Pending" : "Ready" })}
                          className="h-10 rounded-xl bg-accent-soft text-accent font-semibold text-sm hover:bg-accent hover:text-accent-foreground transition">
                          Report: {r.report_status === "Ready" ? "Mark Pending" : "Mark Ready"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubCard>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================
   REQUISITION DIALOG (staff creates request)
   ================================================================ */
function RequisitionModal({ open, onClose, centerId, onCreated }: { open: boolean; onClose: () => void; centerId: string | null; onCreated: () => void }) {
  const [itemType, setItemType] = useState("medicine");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!centerId) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("requisition_requests").insert({
      center_id: centerId, item_type: itemType, item_name: itemName.trim(), quantity_requested: Math.max(1, parseInt(qty || "1", 10) || 1), status: "Pending",
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setItemName(""); setQty(""); onCreated(); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-[var(--shadow-elevated)] space-y-3">
        <div className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /><h3 className="font-bold">Request Stock / Supplies</h3></div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Item type</label>
          <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-white text-sm">
            <option value="medicine">Medicine</option>
            <option value="bed">Bed / Equipment</option>
            <option value="test_kit">Test kit</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Item name</label>
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} required placeholder="e.g. Insulin vials"
            className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-white text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Quantity</label>
          <input value={qty} onChange={(e) => setQty(e.target.value)} required inputMode="numeric" placeholder="e.g. 50"
            className="mt-1 w-full h-11 px-3 rounded-xl border border-border bg-white text-sm" />
        </div>
        {err && <div className="text-xs text-destructive font-semibold">{err}</div>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl bg-muted font-semibold text-sm">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60">{busy ? "Sending..." : "Submit request"}</button>
        </div>
      </form>
    </div>
  );
}

/* ================================================================
   ADMIN: MANAGE CENTERS
   ================================================================ */
type StaffUser = { id: string; email: string; full_name: string; center_id: string | null; role: string | null };

function ManageCentersView({ centers, refreshCenters, onBack }: { centers: Center[]; refreshCenters: () => void; onBack: () => void }) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"PHC" | "CHC">("PHC");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string; pw?: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { const data = await adminListStaff(); setUsers(data as StaffUser[]); } catch (e: any) { setNotice({ kind: "err", msg: e.message }); }
    setLoading(false);
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const reset = async (uid: string, label: string) => {
    setBusy(true); setNotice(null);
    try {
      const res = await adminResetPassword({ data: { targetUserId: uid } });
      setNotice({ kind: "ok", msg: `New temporary password for ${label}`, pw: res.newPassword });
    } catch (e: any) { setNotice({ kind: "err", msg: e.message }); }
    setBusy(false);
  };
  const addCenter = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setNotice(null);
    try {
      const res = await adminCreateCenter({ data: { centerName: newName.trim(), centerType: newType, email: newEmail.trim() } });
      setNotice({ kind: "ok", msg: `Center "${res.center.center_name}" created · login: ${res.email}`, pw: res.password });
      setNewName(""); setNewEmail(""); refreshCenters(); loadUsers();
    } catch (e: any) { setNotice({ kind: "err", msg: e.message }); }
    setBusy(false);
  };
  const copy = (s: string) => { navigator.clipboard.writeText(s); setCopied(s); setTimeout(() => setCopied(null), 1500); };

  const staff = users.filter((u) => u.role === "center_staff");

  return (
    <div className="space-y-5">
      <BackBar label="Manage Centers" onBack={onBack} />
      <Section id="manage" title="Manage Centers & Credentials" subtitle="Admin only · add centers, reset passwords" icon={Building2}>
        <div className="space-y-5">
          {notice && (
            <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${notice.kind === "ok" ? "border-accent/30 bg-accent-soft text-accent" : "border-destructive/30 bg-destructive-soft text-destructive"}`}>
              <div>{notice.msg}</div>
              {notice.pw && (
                <div className="mt-2 flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-foreground font-mono text-xs">
                  <code className="flex-1">{notice.pw}</code>
                  <button onClick={() => copy(notice.pw!)} className="h-8 w-8 grid place-items-center rounded-lg bg-primary text-primary-foreground">
                    {copied === notice.pw ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          <SubCard title="Add New Center" tone="update" icon={PlusCircle}>
            <form onSubmit={addCenter} className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Center name (e.g. Barnagar CHC)"
                className="h-11 px-3 rounded-xl border border-border bg-white text-sm md:col-span-2" />
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="h-11 px-3 rounded-xl border border-border bg-white text-sm">
                <option value="PHC">PHC</option><option value="CHC">CHC</option>
              </select>
              <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="staff email"
                className="h-11 px-3 rounded-xl border border-border bg-white text-sm" />
              <button disabled={busy} className="md:col-span-4 h-11 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
                <PlusCircle className="h-5 w-5" /> Create center & staff login
              </button>
            </form>
          </SubCard>

          <SubCard title={`All Centers (${centers.length})`} tone="default" icon={Building2}>
            {loading ? <Empty msg="Loading..." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr><th className="py-2 pr-4">Center</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Login email</th><th className="py-2 pr-4">Action</th></tr>
                  </thead>
                  <tbody>
                    {centers.map((c) => {
                      const u = staff.find((s) => s.center_id === c.id);
                      return (
                        <tr key={c.id} className="border-t border-border">
                          <td className="py-3 pr-4 font-semibold">{c.center_name}</td>
                          <td className="py-3 pr-4"><span className="text-xs font-bold px-2 py-1 rounded-full bg-primary-soft text-primary">{c.center_type}</span></td>
                          <td className="py-3 pr-4 font-mono text-xs">{u?.email ?? "—"}</td>
                          <td className="py-3 pr-4">
                            {u ? (
                              <button disabled={busy} onClick={() => reset(u.id, c.center_name)}
                                className="h-9 px-3 rounded-lg bg-destructive-soft text-destructive font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-destructive hover:text-destructive-foreground transition disabled:opacity-60">
                                <KeyRound className="h-3.5 w-3.5" /> Reset password
                              </button>
                            ) : <span className="text-xs text-muted-foreground">no user</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SubCard>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================
   REQUISITION TAB
   ================================================================ */
function RequisitionsView({ rows, centers, refresh, onBack, isAdmin }: { rows: ReqRow[]; centers: Center[]; refresh: () => void; onBack: () => void; isAdmin: boolean }) {
  const pending = rows.filter((r) => r.status === "Pending");
  const done = rows.filter((r) => r.status !== "Pending");
  const centerName = (id: string) => centers.find((c) => c.id === id)?.center_name ?? "—";
  const upd = async (id: string, status: ReqRow["status"]) => {
    await supabase.from("requisition_requests").update({ status, resolved_at: new Date().toISOString() }).eq("id", id);
    refresh();
  };
  const badge = (s: string) => s === "Pending" ? "bg-amber-100 text-amber-700"
    : s === "Approved" ? "bg-primary-soft text-primary"
    : s === "Dispatched" ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive";

  return (
    <div className="space-y-5">
      <BackBar label="Requisition Requests" onBack={onBack} />
      <Section id="requisitions" title="Requisition Requests" subtitle={isAdmin ? "All centers · approve, reject or dispatch" : "Your center's requests"} icon={ClipboardList}>
        <div className="space-y-5">
          <SubCard title={`Pending (${pending.length})`} tone="alert" icon={AlertTriangle}>
            {pending.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{r.item_name} <span className="text-xs text-muted-foreground">× {r.quantity_requested}</span></div>
                        <div className="text-xs text-muted-foreground capitalize">{r.item_type.replace("_", " ")} · {centerName(r.center_id)}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Requested {new Date(r.requested_at).toLocaleString()}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge(r.status)}`}>{r.status}</span>
                    </div>
                    {isAdmin && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button onClick={() => upd(r.id, "Approved")} className="h-9 rounded-lg bg-primary-soft text-primary font-semibold text-xs hover:bg-primary hover:text-primary-foreground transition">Approve</button>
                        <button onClick={() => upd(r.id, "Rejected")} className="h-9 rounded-lg bg-destructive-soft text-destructive font-semibold text-xs hover:bg-destructive hover:text-destructive-foreground transition">Reject</button>
                        <button onClick={() => upd(r.id, "Dispatched")} className="h-9 rounded-lg bg-accent-soft text-accent font-semibold text-xs hover:bg-accent hover:text-accent-foreground transition">Dispatched</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SubCard>

          <SubCard title={`History (${done.length})`} tone="default" icon={ClipboardList}>
            {done.length === 0 ? <Empty msg="No resolved requests yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr><th className="py-2 pr-4">Item</th><th className="py-2 pr-4">Qty</th><th className="py-2 pr-4">Center</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Resolved</th></tr>
                  </thead>
                  <tbody>
                    {done.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="py-2 pr-4 font-semibold">{r.item_name}</td>
                        <td className="py-2 pr-4 tabular-nums">{r.quantity_requested}</td>
                        <td className="py-2 pr-4">{centerName(r.center_id)}</td>
                        <td className="py-2 pr-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge(r.status)}`}>{r.status}</span></td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{r.resolved_at ? new Date(r.resolved_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SubCard>
        </div>
      </Section>
    </div>
  );
}

/* ================================================================
   BOTTOM NAV & DASHBOARD
   ================================================================ */
function BottomNav({ active, onSelect, isAdmin }: { active: string; onSelect: (id: string) => void; isAdmin: boolean }) {
  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "stock", label: "Stock", icon: Package },
    { id: "attendance", label: "Staff", icon: Users },
    { id: "beds", label: "Beds", icon: BedDouble },
    { id: "tests", label: "Tests", icon: TestTube },
    { id: "pathology", label: "Pathology", icon: FlaskConical },
    { id: "requisitions", label: "Requests", icon: ClipboardList },
    ...(isAdmin ? [{ id: "manage", label: "Manage", icon: Building2 }] : []),
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-border">
      <div className={`mx-auto max-w-7xl px-2 grid`} style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
        {NAV.map((n) => {
          const Icon = n.icon; const on = active === n.id;
          return (
            <button key={n.id} onClick={() => onSelect(n.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] md:text-xs font-medium transition ${on ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <span className={`h-9 w-12 md:w-14 rounded-full grid place-items-center transition ${on ? "bg-primary-soft" : ""}`}><Icon className="h-5 w-5" /></span>
              {n.label}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

function Dashboard({ meds, staff, beds, tests, path, reqs, centers, isAdmin, onNavigate }: {
  meds: Med[]; staff: StaffRow[]; beds: BedRow[]; tests: TestRow[]; path: PathRow[]; reqs: ReqRow[]; centers: Center[]; isAdmin: boolean;
  onNavigate: (id: string) => void;
}) {
  const totalStock = meds.reduce((a, m) => a + m.stock, 0);
  const lowMeds = meds.filter((m) => m.stock <= 20);
  const present = staff.filter((s) => s.status === "in").length;
  const notMarked = staff.filter((s) => s.status === "idle").length;
  const totalBeds = beds.reduce((a, b) => a + b.count, 0);
  const bedsAttn = beds.filter((b) => !b.available || b.count <= 2);
  const availTests = tests.filter((t) => t.available).length;
  const unavailTests = tests.filter((t) => !t.available);
  const pathPending = path.filter((p) => p.report_status === "Pending" || p.sample_status === "Pending");
  const pendingReqs = reqs.filter((r) => r.status === "Pending");

  const tiles: { id: string; tone: string; icon: any; label: string; value: string; sub: string; needs: string }[] = [
    { id: "stock", tone: lowMeds.length ? "destructive" : "primary", icon: Pill, label: "Medicine Stock", value: `${totalStock}`, sub: `${meds.length} items · ${lowMeds.length} low`, needs: lowMeds.length ? `Refill: ${lowMeds.slice(0, 3).map((m) => m.name).join(", ")}${lowMeds.length > 3 ? "…" : ""}` : "All stock healthy" },
    { id: "attendance", tone: present === 0 ? "destructive" : present < staff.length ? "warning" : "accent", icon: Users, label: "Staff Present", value: `${present}/${staff.length}`, sub: `${notMarked} not marked`, needs: notMarked ? `${notMarked} to mark` : "All staff marked" },
    { id: "beds", tone: bedsAttn.length ? "warning" : "accent", icon: BedDouble, label: "Beds Available", value: `${totalBeds}`, sub: `${beds.filter((b) => b.available).length}/${beds.length} wards open`, needs: bedsAttn.length ? `Check: ${bedsAttn.slice(0, 2).map((b) => b.name).join(", ")}` : "All wards ok" },
    { id: "tests", tone: unavailTests.length ? "warning" : "accent", icon: TestTube, label: "Lab Tests", value: `${availTests}/${tests.length}`, sub: `${unavailTests.length} unavailable`, needs: unavailTests.length ? `Down: ${unavailTests.slice(0, 2).map((t) => t.name).join(", ")}` : "All tests running" },
    { id: "pathology", tone: pathPending.length ? "warning" : "accent", icon: FlaskConical, label: "Pathology", value: `${path.length - pathPending.length}/${path.length}`, sub: `${pathPending.length} pending`, needs: pathPending.length ? `Pending: ${pathPending.slice(0, 2).map((p) => p.test_name).join(", ")}` : "All reports ready" },
    { id: "requisitions", tone: pendingReqs.length ? "destructive" : "primary", icon: ClipboardList, label: "Requisitions", value: `${pendingReqs.length}`, sub: `${reqs.length} total`, needs: pendingReqs.length ? `${pendingReqs.length} awaiting action` : "No pending requests" },
    ...(isAdmin ? [{ id: "manage", tone: "primary", icon: Building2, label: "Centers", value: `${centers.length}`, sub: "Manage credentials", needs: "Add centers, reset passwords" }] : []),
  ];
  const toneMap = (t: string) => {
    switch (t) {
      case "primary": return { chip: "bg-primary-soft text-primary", ring: "ring-primary/20", dot: "bg-primary" };
      case "accent": return { chip: "bg-accent-soft text-accent", ring: "ring-accent/20", dot: "bg-accent" };
      case "destructive": return { chip: "bg-destructive-soft text-destructive", ring: "ring-destructive/30", dot: "bg-destructive" };
      case "warning": return { chip: "bg-amber-100 text-amber-700", ring: "ring-amber-300/40", dot: "bg-amber-500" };
      default: return { chip: "bg-muted text-foreground", ring: "ring-border", dot: "bg-muted-foreground" };
    }
  };
  return (
    <Section id="dashboard" title={isAdmin ? "District overview" : "Today at a glance"} subtitle={isAdmin ? "Aggregate across all 5 centers · tap any tile" : "Tap any card to open that section"} icon={Activity}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {tiles.map((c) => {
          const t = toneMap(c.tone); const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => onNavigate(c.id)}
              className={`text-left rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 active:scale-[0.98] transition-all ring-1 ${t.ring}`}>
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl grid place-items-center ${t.chip}`}><Icon className="h-5 w-5" /></div>
                <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
              </div>
              <div className="mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{c.label}</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.sub}</div>
              <div className={`mt-3 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${t.chip} line-clamp-2`}>{c.needs}</div>
              <div className="mt-2 text-[11px] font-semibold text-primary">Open section →</div>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
function AppPage() {
  const navigate = useNavigate();
  const { profile, role, center, email, loading } = useSession();
  const [active, setActive] = useState("dashboard");
  const [meds, setMeds] = useState<Med[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [path, setPath] = useState<PathRow[]>([]);
  const [reqs, setReqs] = useState<ReqRow[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [reqModal, setReqModal] = useState(false);

  const isAdmin = role === "district_admin";
  const canEdit = role === "center_staff";
  const centerName = isAdmin ? "All Centers · Ujjain" : center?.center_name ?? "—";

  const refreshAll = useCallback(async () => {
    const [{ data: m }, { data: s }, { data: b }, { data: t }, { data: p }, { data: r }, { data: c }] = await Promise.all([
      supabase.from("stock").select("*").order("name"),
      supabase.from("attendance").select("*").order("name"),
      supabase.from("beds").select("*").order("name"),
      supabase.from("tests").select("*").order("name"),
      supabase.from("pathology_labs").select("*").order("test_name"),
      supabase.from("requisition_requests").select("*").order("requested_at", { ascending: false }),
      supabase.from("centers").select("*").order("center_name"),
    ]);
    setMeds((m ?? []) as Med[]);
    setStaff((s ?? []) as StaffRow[]);
    setBeds((b ?? []) as BedRow[]);
    setTests((t ?? []) as TestRow[]);
    setPath((p ?? []) as PathRow[]);
    setReqs((r ?? []) as ReqRow[]);
    setCenters((c ?? []) as Center[]);
  }, []);

  useEffect(() => { if (!loading) refreshAll(); }, [loading, refreshAll]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };
  const onSelect = (id: string) => { setActive(id); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goHome = () => onSelect("dashboard");

  if (loading) return <div className="min-h-screen grid place-items-center"><div className="text-sm text-muted-foreground">Loading portal...</div></div>;
  if (!profile) return <div className="min-h-screen grid place-items-center p-6 text-center"><div><p className="font-semibold">Your account is missing a profile.</p><button onClick={signOut} className="mt-3 h-10 px-4 rounded-lg bg-primary text-primary-foreground">Sign out</button></div></div>;

  const centerId = center?.id ?? null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header centerName={centerName} role={role} email={email} onSignOut={signOut} />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6">
        {active === "dashboard" && <Dashboard meds={meds} staff={staff} beds={beds} tests={tests} path={path} reqs={reqs} centers={centers} isAdmin={isAdmin} onNavigate={onSelect} />}
        {active === "stock" && <MedicineView meds={meds} refresh={refreshAll} onBack={goHome} canEdit={canEdit} centerId={centerId} onRequest={() => setReqModal(true)} />}
        {active === "attendance" && <AttendanceView staff={staff} refresh={refreshAll} onBack={goHome} canEdit={canEdit} centerId={centerId} />}
        {active === "beds" && <BedsView beds={beds} refresh={refreshAll} onBack={goHome} canEdit={canEdit} centerId={centerId} />}
        {active === "tests" && <LabTestsView tests={tests} refresh={refreshAll} onBack={goHome} canEdit={canEdit} centerId={centerId} />}
        {active === "pathology" && <PathologyView rows={path} refresh={refreshAll} onBack={goHome} canEdit={canEdit} centerId={centerId} />}
        {active === "requisitions" && <RequisitionsView rows={reqs} centers={centers} refresh={refreshAll} onBack={goHome} isAdmin={isAdmin} />}
        {active === "manage" && isAdmin && <ManageCentersView centers={centers} refreshCenters={refreshAll} onBack={goHome} />}
        {active === "settings" && (
          <Section id="settings" title="Settings" subtitle="Preferences coming soon" icon={Settings}>
            <Empty msg="Settings will be available in the next update." />
          </Section>
        )}
      </main>
      <BottomNav active={active} onSelect={onSelect} isAdmin={isAdmin} />
      <RequisitionModal open={reqModal} onClose={() => setReqModal(false)} centerId={centerId} onCreated={refreshAll} />
    </div>
  );
}
