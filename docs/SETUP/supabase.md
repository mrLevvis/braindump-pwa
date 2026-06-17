## Supabase-Projekt aufsetzen & anbinden

**Ziel:** Cloud-Datenbank (PostgreSQL) einrichten, Auth konfigurieren, Sicherheit (RLS) aktivieren und den TypeScript-Client im Frontend initialisieren.

---

### 1. Projekt erstellen

- Neues Projekt auf [supabase.com](https://supabase.com/) anlegen (Region: Europe).
- **Zwingend erforderlich:** Häkchen bei *Enable automatic RLS* setzen.
- Passwort im Passwort-Manager sichern.

---

### 2. Datenbank initialisieren

Die Datenbank wird inkrementell über Migrations-Skripte aufgebaut. Alle Skripte liegen unter `supabase/migrations/`. Im Supabase **SQL Editor** der Reihe nach ausführen:

#### Migration 001–006 · `braindump_entries` (Kern-Tabelle)

```sql
CREATE TABLE public.braindump_entries (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at   TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    title        TEXT,
    original_text TEXT NOT NULL,
    category     VARCHAR(50) NOT NULL,
    payload      JSONB DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE public.braindump_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write access" ON public.braindump_entries FOR ALL USING (true);
```

> [!IMPORTANT]
> `FOR ALL USING (true)` deckt alle Commands (SELECT, INSERT, UPDATE, **DELETE**) ab.
> Wenn du für Tests separate Policies anlegst, musst du zwingend auch eine **DELETE-Policy** anlegen — sonst blockt RLS DELETE-Anfragen still ohne Fehlermeldung (`count: 0` statt `error`).

---

#### Migration 007 · `shopping_items`

```sql
CREATE TABLE public.shopping_items (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    label       TEXT        NOT NULL,
    is_done     BOOLEAN     NOT NULL DEFAULT false,
    source_dump UUID        -- nullable, informative FK auf braindump_entries.id
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny all anon" ON public.shopping_items
  FOR ALL TO anon USING (false);

CREATE POLICY "allow authenticated" ON public.shopping_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

#### Migration 008 · Pro-User-Isolation (`user_id` auf allen Tabellen)

Fügt `user_id` auf `braindump_entries` und `shopping_items` hinzu und schränkt die Policies auf `auth.uid() = user_id` ein. Das `DEFAULT auth.uid()` sorgt dafür, dass die `user_id` beim INSERT **automatisch auf DB-Ebene** gesetzt wird — kein Service-Code muss sie explizit mitgeben.

> [!IMPORTANT]
> Vor dem Ausführen die bestehenden Rows löschen — kein automatisches Backfill.

```sql
-- Gleiches Muster für braindump_entries und shopping_items:

ALTER TABLE public.<tabelle>
  ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid()
  REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY "allow authenticated" ON public.<tabelle>;
CREATE POLICY "allow authenticated" ON public.<tabelle>
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Vollständiges SQL: [`supabase/migrations/008_scope_entries_by_user.sql`](../../supabase/migrations/008_scope_entries_by_user.sql)

---

#### Migration 009 · `issues` (Feedback & Bug-Reporting)

```sql
CREATE TABLE public.issues (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id     UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email  TEXT        NOT NULL DEFAULT auth.email(),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'suggestion')),
    title       TEXT        NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done'))
);
```

Vollständiges SQL inkl. RLS: [`supabase/migrations/009_add_issues.sql`](../../supabase/migrations/009_add_issues.sql)

---

### 3. Authentifizierung (Supabase Auth)

Die App nutzt **Magic Link** (E-Mail-OTP) — kein Passwort, kein OAuth. Supabase Auth ist im Projekt automatisch aktiv; es braucht keine extra Konfiguration außer:

1. Im Supabase Dashboard unter **Authentication → URL Configuration** die **Site URL** eintragen:
   - Lokal: `http://localhost:5173`
   - Produktion: deine Vercel-URL (z.B. `https://braindump.vercel.app`)

2. Unter **Redirect URLs** dieselbe URL plus `/auth/callback` eintragen:
   - `http://localhost:5173/auth/callback`
   - `https://braindump.vercel.app/auth/callback`

#### Auth-Flow im Code

```
LoginPage          → supabase.auth.signInWithOtp({ email })
                           ↓ Supabase sendet Magic-Link-E-Mail
Nutzer klickt Link → Supabase leitet auf /auth/callback?...#access_token=... weiter
AuthCallbackPage   → supabase.auth.getSession() verarbeitet den Token
App.tsx            → onAuthStateChange() setzt den User im authSlice
                   → AuthenticatedApp wird gerendert
```

#### Admin-Zugang

`VITE_ADMIN_EMAIL=deine@email.de` in `.env.local` eintragen. Die Route `/admin` (Issue-Übersicht) ist nur für diese E-Mail-Adresse sichtbar — alle anderen werden sofort auf das Dashboard umgeleitet.

---

### 4. Dependencies & Environment

1. Supabase-Client installieren:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Datei `.env.local` im Root-Verzeichnis anlegen (Keys unter *Project Settings → API*):
   ```env
   VITE_SUPABASE_URL=DEINE_PROJECT_URL
   VITE_SUPABASE_ANON_KEY=DEIN_ANON_KEY
   VITE_ADMIN_EMAIL=deine@email.de
   ```

---

### 5. ApiClient (Referenz)

Der zentrale, isolierte Supabase-Client lebt in:

```
src/features/braindump/services/ApiClient.ts
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Alle anderen Services importieren `supabase` aus diesem Modul — niemals einen zweiten Client anlegen.
