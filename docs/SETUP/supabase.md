## Ticket: Supabase-Projekt aufsetzen & anbinden

**Ziel:** Cloud-Datenbank (PostgreSQL) einrichten, Sicherheit (RLS) aktivieren und den TypeScript-Client im Frontend initialisieren.

### 1. Projekt erstellen
- Neues Projekt auf [supabase.com](https://supabase.com/) anlegen (Region: Europe).
- **Zwingend erforderlich:** Häkchen bei *Enable automatic RLS* setzen.
- Passwort im Passwort-Manager sichern.

### 2. Datenbank initialisieren (SQL)
Im Supabase **SQL Editor** dieses Skript ausführen, um die Tabelle anzulegen:
```sql
CREATE TABLE public.braindump_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    title TEXT,
    original_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE public.braindump_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write access" ON public.braindump_entries FOR ALL USING (true);
```

> [!IMPORTANT]
> `FOR ALL USING (true)` deckt alle Commands (SELECT, INSERT, UPDATE, **DELETE**) ab.
> Wenn du für Tests separate Policies anlegst (z. B. „Allow all inserts for test", „Allow all selects for test"), musst du zwingend auch eine **DELETE-Policy** anlegen — sonst blockt RLS DELETE-Anfragen still ohne Fehlermeldung (`count: 0` statt `error`).

### 2b. Tabelle `shopping_items` anlegen (Migration 007)
```sql
CREATE TABLE public.shopping_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    label TEXT NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT false,
    source_dump UUID  -- nullable, informative FK auf braindump_entries.id
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny all anon" ON public.shopping_items
  FOR ALL TO anon USING (false);

CREATE POLICY "allow authenticated" ON public.shopping_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

> [!IMPORTANT]
> Die Policy `allow authenticated` deckt `SELECT`, `INSERT`, `UPDATE` **und** `DELETE` ab.
> Fehlende DELETE-Policy führt bei Supabase zu stillem Blockieren (`count: 0` statt Fehlermeldung).

### 3. Dependencies & Environment
1. Im Terminal installieren: 
   ```bash
   npm install @supabase/supabase-js
   ```
2. Datei `.env.local` im Root-Verzeichnis anlegen und Keys eintragen (zu finden unter Project Settings -> API):
   ```env
   VITE_SUPABASE_URL=DEINE_PROJECT_URL
   VITE_SUPABASE_ANON_KEY=DEIN_ANON_KEY
   ```

### 4. ApiClient implementieren
In der Datei `src/services/ApiClient.ts` die zentrale und isolierte Datenbank-Verbindung (Single Responsibility) aufbauen:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```