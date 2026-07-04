import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, Hospital, Wifi, Mic, MicOff, Minus, Plus, Search,
  LayoutDashboard, Package, Users, BedDouble, TestTube, Settings,
  LogIn, LogOut, CheckCircle2, XCircle, Pill, Activity, PlusCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HealthSync AI — PHC/CHC Staff Portal" },
      { name: "description", content: "Ground-level healthcare management portal for PHC and CHC staff: stock, attendance, beds and lab tests." },
      { property: "og:title", content: "HealthSync AI — PHC/CHC Staff Portal" },
      { property: "og:description", content: "Ground-level healthcare management portal for PHC and CHC staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ---------- Header ---------- */
function Header({ centerName }: { centerName: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const date = now ? now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";
  const time = now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-[var(--shadow-elevated)]">
            <Hospital className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold leading-tight truncate">HealthSync AI</h1>
            <p className="text-[11px] md:text-xs text-muted-foreground truncate">PHC / CHC Staff Portal</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-border text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="font-semibold" suppressHydrationWarning>{date}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Time</div>
            <div className="font-semibold tabular-nums" suppressHydrationWarning>{time}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Center</div>
            <div className="font-semibold">{centerName}</div>
          </div>
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
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
            SR
          </div>
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

/* ---------- Section wrapper ---------- */
function Section({
  title, subtitle, icon: Icon, children, id, actions,
}: { title: string; subtitle?: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; id?: string; actions?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start md:items-center justify-between gap-3 mb-4 flex-col md:flex-row">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="w-full md:w-auto">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Search input ---------- */
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-3 rounded-xl border border-border bg-white text-sm shadow-[var(--shadow-card)] focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

/* ---------- Empty state ---------- */
function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}

/* ---------- Section 1: Medicine Stock ---------- */
type Med = { name: string; stock: number };
const INITIAL_MEDS: Med[] = [
  { name: "Paracetamol", stock: 120 },
  { name: "Amoxicillin", stock: 45 },
  { name: "ORS", stock: 80 },
  { name: "Insulin", stock: 18 },
  { name: "Glucose", stock: 60 },
  { name: "Saline", stock: 35 },
  { name: "Aspirin", stock: 90 },
  { name: "Ibuprofen", stock: 55 },
  { name: "Vitamin C", stock: 200 },
];

function MedicineStock({ meds, setMeds }: { meds: Med[]; setMeds: React.Dispatch<React.SetStateAction<Med[]>> }) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = useMemo(
    () => meds.map((m, i) => ({ m, i })).filter(({ m }) => m.name.toLowerCase().includes(query.trim().toLowerCase())),
    [meds, query]
  );

  const change = (i: number, delta: number) =>
    setMeds((prev) => prev.map((m, idx) => (idx === i ? { ...m, stock: Math.max(0, m.stock + delta) } : m)));

  const addMed = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    const stock = Math.max(0, parseInt(newStock || "0", 10) || 0);
    if (!name) return;
    if (meds.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      setFlash(`"${name}" already exists`);
      setTimeout(() => setFlash(null), 2000);
      return;
    }
    setMeds((p) => [{ name, stock }, ...p]);
    setNewName(""); setNewStock("");
    setFlash(`${name} added`);
    setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <SearchBox value={query} onChange={setQuery} placeholder="Search medicine by name..." />
        <form onSubmit={addMed} className="flex-1 flex flex-col sm:flex-row gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New medicine name"
            className="flex-1 h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <input value={newStock} onChange={(e) => setNewStock(e.target.value)} placeholder="Qty" inputMode="numeric"
            className="h-11 w-full sm:w-24 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button type="submit" className="h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition">
            <PlusCircle className="h-5 w-5" /> Add
          </button>
        </form>
      </div>
      {flash && <div className="text-xs font-semibold text-primary">{flash}</div>}

      {filtered.length === 0 ? (
        <Empty msg={`No medicine matches "${query}"`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(({ m, i }) => {
            const low = m.stock <= 20;
            return (
              <div key={m.name} className="rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-primary-soft grid place-items-center">
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className={`text-xs font-medium ${low ? "text-destructive" : "text-muted-foreground"}`}>
                        {low ? "Low stock" : "In stock"}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold tabular-nums">{m.stock}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => change(i, -1)}
                    className="h-12 rounded-xl bg-destructive-soft text-destructive font-bold grid place-items-center hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition"
                    aria-label={`Decrease ${m.name}`}
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => change(i, 1)}
                    className="h-12 rounded-xl bg-accent-soft text-accent font-bold grid place-items-center hover:bg-accent hover:text-accent-foreground active:scale-95 transition"
                    aria-label={`Increase ${m.name}`}
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Section 2: Voice Stock Update ---------- */
type SR = any;
function VoiceStock({ meds, setMeds }: { meds: Med[]; setMeds: React.Dispatch<React.SetStateAction<Med[]>> }) {
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
    const rec = new SRC();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setText(t);
      if (e.results[e.results.length - 1].isFinal) parseCommand(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setStatus({ ok: false, msg: "Voice error — try again." }); };
    recRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const numberWords: Record<string, number> = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
    eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,fifty:50,hundred:100,
  };

  function parseCommand(raw: string) {
    const t = raw.toLowerCase().trim();
    const med = medsRef.current.find((m) => t.includes(m.name.toLowerCase()));
    if (!med) { setStatus({ ok: false, msg: "Medicine not recognized." }); return; }
    const sign = /(minus|subtract|remove|less)/.test(t) ? -1 : /(plus|add|increase|more)/.test(t) ? 1 : 0;
    if (!sign) { setStatus({ ok: false, msg: "Say 'plus' or 'minus' with a number." }); return; }
    const numMatch = t.match(/\d+/);
    let n = numMatch ? parseInt(numMatch[0], 10) : NaN;
    if (isNaN(n)) {
      for (const w of Object.keys(numberWords)) if (t.includes(w)) { n = numberWords[w]; break; }
    }
    if (isNaN(n)) { setStatus({ ok: false, msg: "Number not recognized." }); return; }
    setMeds((prev) => prev.map((m) => m.name === med.name ? { ...m, stock: Math.max(0, m.stock + sign * n) } : m));
    setStatus({ ok: true, msg: `${med.name} ${sign > 0 ? "+" : "−"}${n} — Stock updated successfully` });
  }

  const toggle = () => {
    if (!supported || !recRef.current) return;
    if (listening) { recRef.current.stop(); return; }
    setText(""); setStatus(null); setListening(true);
    try { recRef.current.start(); } catch { /* ignore */ }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col items-center text-center">
        <button
          onClick={toggle}
          disabled={!supported}
          className={`relative h-28 w-28 md:h-32 md:w-32 rounded-full grid place-items-center transition-all active:scale-95 ${
            listening ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:brightness-110"
          } shadow-[var(--shadow-elevated)] disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Toggle voice input"
        >
          {listening && <span className="absolute inset-0 rounded-full bg-destructive opacity-40 animate-ping" />}
          {listening ? <MicOff className="h-12 w-12 relative" /> : <Mic className="h-12 w-12 relative" />}
        </button>
        <div className="mt-4 min-h-[24px] text-sm font-semibold text-primary">
          {listening ? "Listening..." : supported ? "Tap the mic and speak" : "Voice not supported in this browser"}
        </div>
        <div className="mt-3 w-full max-w-lg rounded-xl bg-muted px-4 py-3 min-h-[52px] text-sm text-foreground">
          {text || <span className="text-muted-foreground">Say e.g. "Paracetamol plus five", "ORS minus two"</span>}
        </div>
        {status && (
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            status.ok ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"
          }`}>
            {status.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Section 3: Attendance ---------- */
type Staff = { id: string; name: string; role: string; status: "in" | "out" | "idle"; last?: string; initials: string; color: string };
const INITIAL_STAFF: Staff[] = [
  { id: "1", name: "Dr. Rajesh Kumar", role: "Physician", status: "idle", initials: "RK", color: "oklch(0.7 0.15 30)" },
  { id: "2", name: "Dr. Neha Singh",   role: "Pediatrician", status: "idle", initials: "NS", color: "oklch(0.65 0.18 300)" },
  { id: "3", name: "Nurse Anita",       role: "Head Nurse", status: "idle", initials: "AN", color: "oklch(0.7 0.15 180)" },
  { id: "4", name: "Nurse Rakesh",      role: "Nurse", status: "idle", initials: "RA", color: "oklch(0.65 0.18 250)" },
];

function Attendance({ staff, setStaff }: { staff: Staff[]; setStaff: React.Dispatch<React.SetStateAction<Staff[]>> }) {
  const [query, setQuery] = useState("");
  const set = (id: string, status: "in" | "out") =>
    setStaff((p) => p.map((s) => s.id === id ? { ...s, status, last: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : s));


  const filtered = staff.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <SearchBox value={query} onChange={setQuery} placeholder="Search doctor or nurse by name..." />
      {filtered.length === 0 ? <Empty msg={`No staff matches "${query}"`} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full grid place-items-center text-white font-bold text-lg" style={{ backgroundColor: s.color }}>
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.role}</div>
                  <div className="mt-1 text-xs font-semibold">
                    {s.status === "in" && <span className="text-accent">🟢 Present {s.last && `· ${s.last}`}</span>}
                    {s.status === "out" && <span className="text-destructive">🔴 Checked Out {s.last && `· ${s.last}`}</span>}
                    {s.status === "idle" && <span className="text-muted-foreground">⚪ Not marked</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => set(s.id, "in")}
                  className={`h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition ${
                    s.status === "in" ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent hover:bg-accent hover:text-accent-foreground"
                  }`}>
                  <LogIn className="h-5 w-5" /> Check In
                </button>
                <button onClick={() => set(s.id, "out")}
                  className={`h-12 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition ${
                    s.status === "out" ? "bg-destructive text-destructive-foreground" : "bg-destructive-soft text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  }`}>
                  <LogOut className="h-5 w-5" /> Check Out
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Section 4: Beds ---------- */
type Bed = { name: string; count: number; available: boolean };
const INITIAL_BEDS: Bed[] = [
  { name: "General Beds", count: 24, available: true },
  { name: "ICU Beds", count: 4, available: true },
  { name: "Emergency Beds", count: 6, available: false },
  { name: "Maternity Beds", count: 8, available: true },
];
function Beds({ beds, setBeds }: { beds: Bed[]; setBeds: React.Dispatch<React.SetStateAction<Bed[]>> }) {
  const [query, setQuery] = useState("");
  const change = (i: number, delta: number) =>
    setBeds((p) => p.map((b, idx) => idx === i ? { ...b, count: Math.max(0, b.count + delta) } : b));
  const setAvail = (i: number, val: boolean) =>
    setBeds((p) => p.map((b, idx) => idx === i ? { ...b, available: val } : b));


  const filtered = beds.map((b, i) => ({ b, i })).filter(({ b }) => b.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <SearchBox value={query} onChange={setQuery} placeholder="Search bed type by name..." />
      {filtered.length === 0 ? <Empty msg={`No bed type matches "${query}"`} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map(({ b, i }) => (
            <div key={b.name} className="rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2.5">
                <div className={`h-10 w-10 rounded-xl grid place-items-center ${b.available ? "bg-accent-soft text-accent" : "bg-destructive-soft text-destructive"}`}>
                  <BedDouble className="h-5 w-5" />
                </div>
                <div className="font-semibold">{b.name}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold tabular-nums">{b.count}</div>
                  <div className="text-xs text-muted-foreground">available now</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => change(i, 1)} className="h-9 w-9 rounded-lg bg-accent-soft text-accent grid place-items-center hover:bg-accent hover:text-accent-foreground transition"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => change(i, -1)} className="h-9 w-9 rounded-lg bg-destructive-soft text-destructive grid place-items-center hover:bg-destructive hover:text-destructive-foreground transition"><Minus className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
                <button onClick={() => setAvail(i, true)}
                  className={`h-10 rounded-lg text-sm font-semibold transition ${b.available ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"}`}>
                  Available
                </button>
                <button onClick={() => setAvail(i, false)}
                  className={`h-10 rounded-lg text-sm font-semibold transition ${!b.available ? "bg-destructive text-destructive-foreground shadow" : "text-muted-foreground"}`}>
                  Unavailable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Section 5: Lab Tests ---------- */
type LabTest = { name: string; available: boolean };
const INITIAL_TESTS: LabTest[] = ["Blood Test", "X-Ray", "ECG", "COVID Test", "Urine Test", "CBC"].map((n, i) => ({ name: n, available: i !== 3 }));
function LabTests({ tests, setTests }: { tests: LabTest[]; setTests: React.Dispatch<React.SetStateAction<LabTest[]>> }) {
  const [query, setQuery] = useState("");
  const setAvail = (i: number, val: boolean) =>
    setTests((p) => p.map((t, idx) => idx === i ? { ...t, available: val } : t));


  const filtered = tests.map((t, i) => ({ t, i })).filter(({ t }) => t.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <SearchBox value={query} onChange={setQuery} placeholder="Search lab test by name..." />
      {filtered.length === 0 ? <Empty msg={`No lab test matches "${query}"`} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(({ t, i }) => (
            <div key={t.name} className="rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center">
                    <TestTube className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className={`text-xs font-medium ${t.available ? "text-accent" : "text-destructive"}`}>
                      {t.available ? "● Available today" : "● Not available"}
                    </div>
                  </div>
                </div>
                <span className={`h-3 w-3 rounded-full ${t.available ? "bg-accent" : "bg-destructive"} shadow ring-4 ${t.available ? "ring-accent-soft" : "ring-destructive-soft"}`} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted">
                <button onClick={() => setAvail(i, true)}
                  className={`h-10 rounded-lg text-sm font-semibold transition ${t.available ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground"}`}>
                  Available
                </button>
                <button onClick={() => setAvail(i, false)}
                  className={`h-10 rounded-lg text-sm font-semibold transition ${!t.available ? "bg-destructive text-destructive-foreground shadow" : "text-muted-foreground"}`}>
                  Unavailable
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Bottom Nav ---------- */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "stock", label: "Stock", icon: Package },
  { id: "attendance", label: "Attendance", icon: Users },
  { id: "beds", label: "Beds", icon: BedDouble },
  { id: "tests", label: "Tests", icon: TestTube },
  { id: "settings", label: "Settings", icon: Settings },
];

function BottomNav({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-border">
      <div className="mx-auto max-w-7xl px-2 grid grid-cols-6">
        {NAV.map((n) => {
          const Icon = n.icon;
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => onSelect(n.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] md:text-xs font-medium transition ${on ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <span className={`h-9 w-14 md:w-16 rounded-full grid place-items-center transition ${on ? "bg-primary-soft" : ""}`}>
                <Icon className="h-5 w-5" />
              </span>
              {n.label}
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

/* ---------- Dashboard summary ---------- */
function DashboardSummary({ meds }: { meds: Med[] }) {
  const totalStock = meds.reduce((a, m) => a + m.stock, 0);
  const low = meds.filter((m) => m.stock <= 20).length;
  const cards = [
    { label: "Total Medicines", value: meds.length, tone: "primary" },
    { label: "Units in Stock", value: totalStock, tone: "accent" },
    { label: "Low Stock Items", value: low, tone: low ? "destructive" : "muted" },
    { label: "System Status", value: "Healthy", tone: "accent" },
  ];
  const tone = (t: string) =>
    t === "primary" ? "bg-primary-soft text-primary" :
    t === "accent" ? "bg-accent-soft text-accent" :
    t === "destructive" ? "bg-destructive-soft text-destructive" : "bg-muted text-foreground";

  return (
    <Section id="dashboard" title="Today at a glance" subtitle="Live overview of your center" icon={Activity}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl p-4 ${tone(c.tone)}`}>
            <div className="text-xs font-semibold opacity-80">{c.label}</div>
            <div className="mt-2 text-2xl md:text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Page ---------- */
function Index() {
  const [meds, setMeds] = useState<Med[]>(INITIAL_MEDS);
  const [active, setActive] = useState("dashboard");

  const onSelect = (id: string) => {
    setActive(id);
    if (id === "settings") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header centerName="Rampur PHC" />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-10">
        <DashboardSummary meds={meds} />

        <Section id="stock" title="Medicine Stock" subtitle="Search, add new, and update quickly" icon={Pill}>
          <MedicineStock meds={meds} setMeds={setMeds} />
        </Section>

        <Section title="Voice Stock Update" subtitle="Hands-free updates while you work" icon={Mic}>
          <VoiceStock meds={meds} setMeds={setMeds} />
        </Section>

        <Section id="attendance" title="Doctor & Nurse Attendance" subtitle="Search by name and mark check-in / out" icon={Users}>
          <Attendance />
        </Section>

        <Section id="beds" title="Bed Availability" subtitle="Search and update bed status" icon={BedDouble}>
          <Beds />
        </Section>

        <Section id="tests" title="Lab Tests" subtitle="Search tests and set today's availability" icon={TestTube}>
          <LabTests />
        </Section>
      </main>
      <BottomNav active={active} onSelect={onSelect} />
    </div>
  );
}
