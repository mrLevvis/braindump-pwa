CREATE TABLE public.braindump_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    title TEXT,
    original_text TEXT NOT NULL,
    category TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb NOT NULL
);

ALTER TABLE public.braindump_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read/write access" ON public.braindump_entries FOR ALL USING (true);