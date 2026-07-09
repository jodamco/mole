INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN storage.buckets.id IS 'Unique identifier for the storage bucket';

DROP POLICY IF EXISTS "documents_storage_select" ON storage.objects;
CREATE POLICY "documents_storage_select" ON storage.objects
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "documents_storage_select_own" ON storage.objects;
CREATE POLICY "documents_storage_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = (
            SELECT storage_path FROM public.users WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "documents_storage_insert_own" ON storage.objects;
CREATE POLICY "documents_storage_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = (
            SELECT storage_path FROM public.users WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "documents_storage_update_own" ON storage.objects;
CREATE POLICY "documents_storage_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = (
            SELECT storage_path FROM public.users WHERE user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "documents_storage_delete_own" ON storage.objects;
CREATE POLICY "documents_storage_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = (
            SELECT storage_path FROM public.users WHERE user_id = (select auth.uid())
        )
    );

COMMENT ON POLICY "documents_storage_select_own" ON storage.objects IS 'Users can read files in their own storage folder';
COMMENT ON POLICY "documents_storage_insert_own" ON storage.objects IS 'Users can upload files to their own storage folder';
COMMENT ON POLICY "documents_storage_update_own" ON storage.objects IS 'Users can update files in their own storage folder';
COMMENT ON POLICY "documents_storage_delete_own" ON storage.objects IS 'Users can delete files in their own storage folder';
