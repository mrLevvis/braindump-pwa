# Supabase CLI auf Windows installieren

## Voraussetzungen
- Node.js und npm müssen installiert sein.  
  [Node.js Download](https://nodejs.org/)

## Installation

1. Öffne PowerShell als Administrator.
2. Führe folgenden Befehl aus, um die Supabase CLI global zu installieren:
   
```bash
npm install -g supabase
```

3. Überprüfe die Installation:

```bash
supabase --version
```
Wenn die version angezeigt wird, ist die CLI korrekt installiert.

4. Melde dich bei Supabase an:

```bash
supabase login                                      # einmal pro Rechner
supabase link --project-ref XXX                     # verknüpft den lokalen Ordner mit deinem Cloud-Projekt
```


```bash
supabase functions new process-brain-dump           # Gerüst anlegen
supabase secrets set OPENAI_API_KEY=sk-...          # Key in der Cloud (nie im Repo!)
supabase functions deploy process-brain-dump        # hochladen
```
