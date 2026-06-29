-- Migration 023: Fix confirm_ingest RPC — summary column is jsonb, not text[]
--
-- Bug in 022: The INSERT used ARRAY(SELECT jsonb_array_elements_text(e->'summary'))
-- which produces text[] — but the summary column is jsonb. Same issue in the
-- additionalInfos UPDATE which used ARRAY[]::text[] and array concatenation (||)
-- instead of jsonb operators.
--
-- Fix: use e->'summary' (direct jsonb extraction) for INSERT,
-- and jsonb || to_jsonb(...) for the UPDATE.

CREATE OR REPLACE FUNCTION public.confirm_ingest(
  p_capture_id       UUID,
  p_entries          JSONB,
  p_shopping_items   JSONB DEFAULT '[]'::jsonb,
  p_additional_infos JSONB DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- 1. Neue Entries einfügen (alle unter derselben captureId).
  INSERT INTO public.braindump_entries__test (
    title, original_text, category, payload,
    capture_id, source_excerpt, summary, completed, recurrence, series_entry_id
  )
  SELECT
    e->>'title',
    e->>'original_text',
    e->>'category',
    COALESCE(e->'payload', '{}'::jsonb),
    p_capture_id,
    e->>'source_excerpt',
    e->'summary',
    CASE e->>'completed'
      WHEN 'true'  THEN true
      WHEN 'false' THEN false
      ELSE NULL
    END,
    NULLIF(e->'recurrence', 'null'::jsonb),
    (e->>'series_entry_id')::uuid
  FROM jsonb_array_elements(p_entries) AS e;

  -- 2. Shopping-Items einfügen.
  --    id und parent_id werden client-seitig vorberechnet (UUID-Map für Parent-Child).
  --    Fehlender id-Key → gen_random_uuid() als Fallback.
  IF jsonb_array_length(p_shopping_items) > 0 THEN
    INSERT INTO public.shopping_items (
      id, label, category, estimated_price,
      count, amount, unit, is_done, source_dump, parent_id
    )
    SELECT
      COALESCE((i->>'id')::uuid, gen_random_uuid()),
      i->>'label',
      COALESCE(i->>'category', 'SONSTIGES'),
      (i->>'estimated_price')::numeric,
      COALESCE((i->>'count')::integer, 1),
      (i->>'amount')::numeric,
      COALESCE(i->>'unit', 'STUECK'),
      false,
      p_capture_id,
      (i->>'parent_id')::uuid
    FROM jsonb_array_elements(p_shopping_items) AS i;
  END IF;

  -- 3. Zusatzinfos an summary bestehender Entries anhängen.
  --    GROUP BY verhindert Datenverlust wenn mehrere Infos auf denselben Entry zeigen:
  --    ein einzelnes UPDATE pro Ziel-Entry statt n sequenzieller Overwrites.
  IF jsonb_array_length(p_additional_infos) > 0 THEN
    UPDATE public.braindump_entries__test AS target
    SET summary = COALESCE(target.summary, '[]'::jsonb) || to_jsonb(agg.contents)
    FROM (
      SELECT
        (info->>'target_entry_id')::uuid AS target_id,
        ARRAY_AGG(info->>'content')      AS contents
      FROM jsonb_array_elements(p_additional_infos) AS info
      GROUP BY (info->>'target_entry_id')::uuid
    ) AS agg
    WHERE target.id     = agg.target_id
      AND target.user_id = auth.uid();
  END IF;
END;
$$;
