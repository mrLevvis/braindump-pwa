-- Migration 014: deadline-Feld pro Shopping-Item (optional, nur Datum)
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT NULL;
