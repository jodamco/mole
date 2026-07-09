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

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_own" ON public.documents;
CREATE POLICY "documents_select_own" ON public.documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = documents.collection_id
              AND collections.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
CREATE POLICY "documents_insert_own" ON public.documents
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = documents.collection_id
              AND collections.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "documents_update_own" ON public.documents;
CREATE POLICY "documents_update_own" ON public.documents
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = documents.collection_id
              AND collections.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;
CREATE POLICY "documents_delete_own" ON public.documents
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE collections.id = documents.collection_id
              AND collections.user_id = (select auth.uid())
        )
    );

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chunks_select_own" ON public.chunks;
CREATE POLICY "chunks_select_own" ON public.chunks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.documents
            JOIN public.collections ON collections.id = documents.collection_id
            WHERE documents.id = chunks.document_id
              AND collections.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "service_role_full_access_chunks" ON public.chunks;
CREATE POLICY "service_role_full_access_chunks" ON public.chunks
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "chunks_select_own" ON public.chunks IS 'Users can read chunks of their own documents';
COMMENT ON POLICY "service_role_full_access_chunks" ON public.chunks IS 'Service role has full access to chunks';

GRANT SELECT ON public.chunks TO authenticated;

ALTER TABLE public.document_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_status_select_all" ON public.document_status;
CREATE POLICY "document_status_select_all" ON public.document_status
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "service_role_full_access_document_status" ON public.document_status;
CREATE POLICY "service_role_full_access_document_status" ON public.document_status
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "document_status_select_all" ON public.document_status IS 'All authenticated users can read document statuses';
COMMENT ON POLICY "service_role_full_access_document_status" ON public.document_status IS 'Service role has full access';

ALTER TABLE public.chunking_strategy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chunking_strategy_select_all" ON public.chunking_strategy;
CREATE POLICY "chunking_strategy_select_all" ON public.chunking_strategy
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "service_role_full_access_chunking_strategy" ON public.chunking_strategy;
CREATE POLICY "service_role_full_access_chunking_strategy" ON public.chunking_strategy
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "chunking_strategy_select_all" ON public.chunking_strategy IS 'All authenticated users can read chunking strategies';
COMMENT ON POLICY "service_role_full_access_chunking_strategy" ON public.chunking_strategy IS 'Service role has full access';

ALTER TABLE public.document_status_transition ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_status_transition_select_all" ON public.document_status_transition;
CREATE POLICY "document_status_transition_select_all" ON public.document_status_transition
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "service_role_full_access_document_status_transition" ON public.document_status_transition;
CREATE POLICY "service_role_full_access_document_status_transition" ON public.document_status_transition
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "document_status_transition_select_all" ON public.document_status_transition IS 'All authenticated users can read status transitions';
COMMENT ON POLICY "service_role_full_access_document_status_transition" ON public.document_status_transition IS 'Service role has full access';

GRANT SELECT ON public.document_status_transition TO authenticated;
