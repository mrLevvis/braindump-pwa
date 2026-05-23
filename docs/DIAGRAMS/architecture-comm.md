```mermaid
flowchart TD
    %% Tooling Phase
    subgraph Tooling ["Vite (Build-Prozess)"]
        V[Bündelt TS & generiert Tailwind-CSS]
    end

    %% Client Layer (Browser)
    subgraph Client ["Frontend (Browser)"]
        direction TB
        UI["React (Skelett) <br/> + Tailwind (Maßanzug)"]
        Store["Zustand (Gehirn / State-Management)"]
        Services["TypeScript Services <br/> (Diplomaten: SupabaseClient, Media)"]

        UI == "1. User Input" ==> Store
        Store == "7. State Update triggert UI" ==> UI
        
        Store == "2. Delegiert Aufgabe" ==> Services
        Services == "6. Liefert typsicheres TS-Objekt" ==> Store
    end

    %% Cloud Backend (Supabase)
    subgraph BaaS ["Supabase (Backend-as-a-Service)"]
        direction TB
        Edge["Edge Function (Sicheres BFF) <br/> (Hält den OpenAI-Key)"]
        DB[("PostgreSQL Datenbank <br/> (Persistenz)")]
    end

    %% External APIs
    subgraph External ["Externe APIs"]
        KI["OpenAI API <br/> (KI-Modell)"]
    end

    %% Netzwerkkonnektivität
    Services -- "3. HTTP-Request" --> Edge
    Edge -- "4. Request mit API-Key" --> KI
    KI -. "Rohes JSON" .-> Edge
    Edge -- "5. Speichert validierte Daten" --> DB
    Edge -. "Geparste Daten" .-> Services

    %% Farben und Styling
    classDef frontend fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef state fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    classDef service fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff
    classDef supabase fill:#0f766e,stroke:#14b8a6,stroke-width:2px,color:#fff
    classDef ki fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
    classDef tooling fill:#374151,stroke:#9ca3af,stroke-width:1px,color:#e5e7eb,stroke-dasharray: 5 5

    class UI frontend
    class Store state
    class Services service
    class Edge,DB supabase
    class KI ki
    class V tooling