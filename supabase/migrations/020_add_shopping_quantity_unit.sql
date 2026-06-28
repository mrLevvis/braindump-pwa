-- Migration: Mengenangabe (count + amount + unit) für shopping_items
-- count: Anzahl der Einheiten (z.B. 3 Flaschen), Default 1
-- amount: Menge pro Stück (z.B. 500 für 500g), NULL wenn unit = STUECK
-- unit: Einheit, Default STUECK; geschlossener Enum

ALTER TABLE shopping_items
  ADD COLUMN count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN amount DECIMAL NULL,
  ADD COLUMN unit TEXT NOT NULL DEFAULT 'STUECK'
    CHECK (unit IN ('STUECK', 'G', 'KG', 'ML', 'L', 'CM', 'M'));
