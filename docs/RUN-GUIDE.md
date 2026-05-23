## 🚀 Projekt starten (Run Guide)

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
   Erstelle eine Datei namens `.env.local` im Hauptverzeichnis (neben der `package.json`) und füge deine API-Keys ein:
   ```env
   VITE_SUPABASE_URL=deine_supabase_url
   VITE_SUPABASE_ANON_KEY=dein_supabase_anon_key
   ```
4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

---

### 2. Daily Business (Der tägliche Workflow)
Dein Standard-Ablauf, wenn das Setup bereits steht und du deinen Arbeitstag in VS Code beginnst.

1. **Terminal im Projektordner öffnen.**
2. **Neuesten Stand holen** *(Gewöhn dir das als Routine an, um Konflikte zu vermeiden!)*:
   ```bash
   git pull
   ```
3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```
*(Tipp: Klicke im VS Code Terminal mit `Strg + Klick` auf den `http://localhost:5173` Link, um die PWA direkt im Browser zu öffnen).*