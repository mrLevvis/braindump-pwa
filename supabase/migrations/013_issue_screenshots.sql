-- Screenshot-Anhang für Feedback-Issues

ALTER TABLE public.issues
    ADD COLUMN screenshot_url TEXT;

-- Storage Bucket (public, damit Admin die Bilder direkt laden kann)
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-screenshots', 'issue-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "authenticated can upload screenshots" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'issue-screenshots');

CREATE POLICY "authenticated can view screenshots" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'issue-screenshots');
