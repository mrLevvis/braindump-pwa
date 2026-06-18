# Auth-Flow (Magic Link)

BrainDump nutzt Supabase Magic Links — kein Passwort, kein OAuth. Der User bekommt eine E-Mail mit einem Einmal-Link und ist danach dauerhaft eingeloggt bis zur expliziten Abmeldung.

## Ablauf

```mermaid
sequenceDiagram
    actor User
    participant App as App.tsx
    participant AuthStore as authSlice (Zustand)
    participant Supabase as Supabase Auth
    participant Mail as E-Mail-Provider

    User->>App: Öffnet PWA
    App->>Supabase: getSession()
    Supabase-->>App: session = null

    App->>AuthStore: setUser(null)
    App-->>User: Zeigt LoginPage

    User->>App: Gibt E-Mail ein & klickt "Magic Link senden"
    App->>Supabase: signInWithOtp({ email })
    Supabase->>Mail: Sendet Login-E-Mail
    Mail-->>User: E-Mail mit einmaligem Login-Link

    User->>App: Klickt Link in E-Mail → /auth/callback#access_token=…
    Note over App,Supabase: Supabase verarbeitet Token aus dem URL-Fragment
    Supabase-->>App: onAuthStateChange (Event: SIGNED_IN, session)

    App->>AuthStore: setUser(session.user)
    App-->>User: Rendert AuthenticatedApp (Dashboard)

    Note over User,App: Session wird im Browser persistiert (localStorage)
    Note over App,Supabase: Bei erneutem Öffnen: getSession() liefert direkt die bestehende Session
```

## Abmeldung

```mermaid
sequenceDiagram
    actor User
    participant App as App.tsx
    participant AuthStore as authSlice
    participant Supabase as Supabase Auth

    User->>App: Klickt "Abmelden" im Dashboard-Header
    App->>Supabase: signOut()
    Supabase-->>App: onAuthStateChange (Event: SIGNED_OUT)
    App->>AuthStore: setUser(null)
    App-->>User: Zeigt LoginPage
```

## Schlüsseldateien

| Datei | Rolle |
| :--- | :--- |
| `src/App.tsx` | Root-Komponente: `getSession()` + `onAuthStateChange`-Listener |
| `src/store/authSlice.ts` | Hält `user: User \| null` global im Zustand-Store |
| `src/services/auth/authService.ts` | Kapselt `signInWithOtp` und `signOut` |
| `src/features/auth/views/LoginPage.tsx` | UI: E-Mail-Eingabe, Magic-Link-Versand |
