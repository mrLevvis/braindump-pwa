/**
 * supabase/functions/_shared/priceHistory.ts
 * Price resolution for recurring shopping items:
 * look up past prices from shopping_items and derive a weighted estimate.
 */

// deno-lint-ignore-file no-explicit-any

export interface PriceEntry {
  price: number;
  recorded_at: string; // ISO timestamp
}

/**
 * Queries all recorded prices for a given item label (case-insensitive).
 * Only returns rows where estimated_price is not null.
 */
export async function fetchPriceHistory(
  supabase: any,
  userId: string,
  label: string
): Promise<PriceEntry[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("estimated_price, created_at")
    .eq("user_id", userId)
    .ilike("label", label)
    .not("estimated_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return (data as Array<{ estimated_price: number; created_at: string }>).map(
    (row) => ({ price: row.estimated_price, recorded_at: row.created_at })
  );
}

/**
 * Derives a price from history using exponential decay weighting (newer = more weight).
 * Returns aiEstimate unchanged when no valid history is available.
 *
 * Decay constant 0.5: the second-most-recent entry contributes ~60% of the most recent,
 * the third ~37%, and so on — a fast but not total decay toward the newest price.
 */
export function resolveItemPrice(
  priceHistory: PriceEntry[],
  aiEstimate: number | null
): number | null {
  const valid = priceHistory.filter((e) => typeof e.price === "number" && e.price > 0);
  if (valid.length === 0) return aiEstimate;

  const sorted = [...valid].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  const DECAY = 0.5;
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < sorted.length; i++) {
    const weight = Math.exp(-i * DECAY);
    weightedSum += sorted[i].price * weight;
    totalWeight += weight;
  }

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}
