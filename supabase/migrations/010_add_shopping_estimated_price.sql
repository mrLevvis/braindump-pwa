-- Migration 010: Preisschätzung für Einkaufsartikel
-- Die KI schätzt beim Ingest einen ungefähren Preis (in EUR) pro Artikel.
-- Nullable, weil ältere Einträge keinen Preis haben und die Schätzung optional ist.

ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS estimated_price NUMERIC(8, 2) DEFAULT NULL;
