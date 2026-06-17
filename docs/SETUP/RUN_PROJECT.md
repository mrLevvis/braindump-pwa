## Projekt starten (Run Guide)

### 1. Initiales Setup (Von neu auf)

Nutze diesen Weg, wenn du das Projekt zum ersten Mal auf einem neuen Rechner einrichtest oder das Repository frisch geklont hast.

1. **Repository klonen & Ordner öffnen:**
   ```bash
   git clone [DEINE_REPO_URL]
   cd braindump-pwa
   ```
2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```
3. **Umgebungsvariablen konfigurieren:**
   Erstelle eine Datei namens `.env.local` im Hauptverzeichnis und trage deine Keys ein:
   ```env
   VITE_SUPABASE_URL=deine_supabase_url
   VITE_SUPABASE_ANON_KEY=dein_supabase_anon_key
   VITE_ADMIN_EMAIL=deine@email.de
   ```
   - `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`: Unter *Project Settings → API* im Supabase-Dashboard.
   - `VITE_ADMIN_EMAIL`: Die E-Mail-Adresse, die Zugriff auf die Admin-View unter `/admin` erhält. Bleibt leer → kein Admin-View.

4. **Datenbank & Edge Functions einrichten:**
   Folge dem [Supabase Setup Guide](./supabase.md) und dem [Edge Function Guide](./edge-function-groq-setup.md) — einmalig nötig.

5. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

---

### 2. Daily Business (Der tägliche Workflow)

Dein Standard-Ablauf, wenn das Setup bereits steht.

1. **Terminal im Projektordner öffnen.**
2. **Neuesten Stand holen** *(Gewöhn dir das als Routine an, um Konflikte zu vermeiden!)*:
   ```bash
   git pull
   ```
3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

*(Tipp: Klicke im VS Code Terminal mit `Strg + Klick` auf den `http://localhost:5173`-Link, um die PWA direkt im Browser zu öffnen.)*

---

### 3. Verfügbare npm-Scripts

| Script | Befehl | Zweck |
| :--- | :--- | :--- |
| Dev-Server | `npm run dev` | Lokale Entwicklung mit HMR |
| Build | `npm run build` | Produktions-Build (`tsc -b && vite build`) |
| Preview | `npm run preview` | Produktions-Build lokal testen |
| Lint | `npm run lint` | ESLint ausführen |
