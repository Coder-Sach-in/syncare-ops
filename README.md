# SmartSehat AI

AI-driven health centre & supply chain management platform for Ujjain district's PHCs/CHCs — built for **Build with AI: Code for Communities — Indore Edition** (GDG Indore × Google Cloud), Track 3: Smart Health.

## Live App

https://syncare-ops.lovable.app

## Problem

PHCs and CHCs face recurring operational gaps — medicine stock-outs, unmanaged patient footfall, bed unavailability, and unpredictable doctor attendance — tracked manually with no real-time visibility for district administrators until a shortage has already hurt patients.

## Solution

SmartSehat AI connects ground-level health centres to district administrators through a shared, live data layer, with a Gemini-powered AI engine that reasons over real operational data to recommend action — not just display numbers.

**Three connected views:**

- **PHC/CHC Staff Portal** — centre-level login, voice-enabled stock logging, attendance, beds, lab tests, and pathology tracking, plus stock requisition requests
- **AI & Analytics Engine** (Gemini API) — early stock-out warnings, smart cross-centre redistribution recommendations, expiry-based wastage prevention, and real footfall trend analysis
- **District Admin Dashboard** — live status across all centres, automated escalation alerts, performance scorecard, and one-click requisition approval

## Test Credentials (for judges/reviewers)

**District Admin** (full district oversight, Ujjain):

- Email: `admin@smartsehat.ai`
- Password: `SmartSehat@2026`

**Centre Staff** (same password for all — `SmartSehat@2026`):

| Centre        | Type | Login Email          |
| ------------- | ---- | -------------------- |
| Charak Bhawan | CHC  | charak@smartsehat.ai |
| Ghatia        | CHC  | ghatia@smartsehat.ai |
| Jharda        | CHC  | jharda@smartsehat.ai |
| Narwar        | CHC  | narwar@smartsehat.ai |
| Tarana        | CHC  | tarana@smartsehat.ai |
| Unhel         | PHC  | unhel@smartsehat.ai  |

> Log in as a centre to see the ground-level Staff Portal, or as the district admin to see the full Ujjain district dashboard, AI Insights panel, and requisition approvals.

## Tech Stack

- **Application:** Lovable (full-stack generation, shared team workspace)
- **Backend / Database:** Supabase (PostgreSQL, Auth, Row Level Security)
- **AI Reasoning:** Gemini API (server-side, explainable insight generation)
- **Voice Input:** Browser-native Speech-to-Text
- **Security:** Role-based access control (district_admin / center_staff) via a dedicated `user_roles` table, with RLS enforced on every data table so a centre can only access its own records. Role assignment is locked to trusted server-side functions only.

## Team — CodeHub

- Sachin Kumar — Team Lead
- Ali Khan
- Vanshika Gehi

## Event

Build with AI: Code for Communities — Indore Edition
GDG Indore × Google Cloud · National Hackathon (submitted problem statements by sitting Members of Parliament)
