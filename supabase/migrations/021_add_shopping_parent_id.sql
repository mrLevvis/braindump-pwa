ALTER TABLE shopping_items
  ADD COLUMN parent_id UUID REFERENCES shopping_items(id) ON DELETE CASCADE;
