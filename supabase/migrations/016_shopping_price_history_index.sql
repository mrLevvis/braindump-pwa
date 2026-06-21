-- Speed up price-history lookups: user_id + case-insensitive label, only where a price exists.
-- ILIKE without wildcards can use an expression index on lower(label).
CREATE INDEX IF NOT EXISTS idx_shopping_items_price_history
  ON public.shopping_items (user_id, lower(label))
  WHERE estimated_price IS NOT NULL;
