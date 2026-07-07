ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "service_role_full_access_users" ON public.users;
CREATE POLICY "service_role_full_access_users" ON public.users
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "users_select_own" ON public.users IS 'Users can read their own profile';
COMMENT ON POLICY "users_insert_own" ON public.users IS 'Users can create their own profile';
COMMENT ON POLICY "users_update_own" ON public.users IS 'Users can update their own profile';
COMMENT ON POLICY "service_role_full_access_users" ON public.users IS 'Service role has full access';

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collections_select_own" ON public.collections;
CREATE POLICY "collections_select_own" ON public.collections
    FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "collections_insert_own" ON public.collections;
CREATE POLICY "collections_insert_own" ON public.collections
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "collections_update_own" ON public.collections;
CREATE POLICY "collections_update_own" ON public.collections
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "collections_delete_own" ON public.collections;
CREATE POLICY "collections_delete_own" ON public.collections
    FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "service_role_full_access_collections" ON public.collections;
CREATE POLICY "service_role_full_access_collections" ON public.collections
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "collections_select_own" ON public.collections IS 'Users can read their own collections';
COMMENT ON POLICY "collections_insert_own" ON public.collections IS 'Users can create collections';
COMMENT ON POLICY "collections_update_own" ON public.collections IS 'Users can update their own collections';
COMMENT ON POLICY "collections_delete_own" ON public.collections IS 'Users can delete their own collections';
COMMENT ON POLICY "service_role_full_access_collections" ON public.collections IS 'Service role has full access';

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_own" ON public.documents;
CREATE POLICY "documents_select_own" ON public.documents
    FOR SELECT TO authenticated
    USING (created_by = (select auth.uid())::text);

DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
CREATE POLICY "documents_insert_own" ON public.documents
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (select auth.uid())::text);

DROP POLICY IF EXISTS "documents_update_own" ON public.documents;
CREATE POLICY "documents_update_own" ON public.documents
    FOR UPDATE TO authenticated
    USING (created_by = (select auth.uid())::text);

DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;
CREATE POLICY "documents_delete_own" ON public.documents
    FOR DELETE TO authenticated
    USING (created_by = (select auth.uid())::text);

DROP POLICY IF EXISTS "service_role_full_access_documents" ON public.documents;
CREATE POLICY "service_role_full_access_documents" ON public.documents
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "documents_select_own" ON public.documents IS 'Users can read their own documents';
COMMENT ON POLICY "documents_insert_own" ON public.documents IS 'Users can create documents';
COMMENT ON POLICY "documents_update_own" ON public.documents IS 'Users can update their own documents';
COMMENT ON POLICY "documents_delete_own" ON public.documents IS 'Users can delete their own documents';
COMMENT ON POLICY "service_role_full_access_documents" ON public.documents IS 'Service role has full access';

ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chunks_select_own" ON public.chunks;
CREATE POLICY "chunks_select_own" ON public.chunks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            WHERE documents.id = chunks.document_id
              AND documents.created_by = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "service_role_full_access_chunks" ON public.chunks;
CREATE POLICY "service_role_full_access_chunks" ON public.chunks
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "chunks_select_own" ON public.chunks IS 'Users can read chunks of their own documents';
COMMENT ON POLICY "service_role_full_access_chunks" ON public.chunks IS 'Service role has full access to chunks';
