## Ticket: Supabase-Projekt aufsetzen & anbinden

**Ziel:** Cloud-Datenbank (PostgreSQL) einrichten, Sicherheit (RLS) aktivieren und den TypeScript-Client im Frontend initialisieren.

### 1. Projekt erstellen
- Neues Projekt auf [supabase.com](https://supabase.com/) anlegen (Region: Europe).
- **Zwingend erforderlich:** Häkchen bei *Enable automatic RLS* setzen.
- Passwort im Passwort-Manager sichern.

### 2. Datenbank initialisieren (SQL)
Im Supabase **SQL Editor** dieses Skript ausführen, um die Tabelle anzulegen:
```sql
CREATE TABLE public.brain_dumps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    original_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE public.brain_dumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write access" ON public.brain_dumps FOR ALL USING (true);
```

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