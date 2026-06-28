-- Enable vectors in the database
CREATE EXTENSION vector WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN new;
END;
$$;

CREATE TABLE IF NOT EXISTS public.users(
    user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    first_name varchar(50) NOT NULL,
    last_name varchar(50) NOT NULL,
    storage_path text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

COMMENT ON TABLE public.users IS 'Contains user information complementary to what auth.users already stores';

COMMENT ON COLUMN public.users.storage_path IS 'Users storage path prefix';

CREATE OR REPLACE TRIGGER "trigger_updated_at_users"
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.collections(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    description text DEFAULT NULL,
    metadata jsonb DEFAULT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.collections IS 'Contains definitions about the collections created by users. Collections are groups of documents to be used as source of data.';

CREATE OR REPLACE TRIGGER "trigger_updated_at_collections"
    BEFORE UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.document_status(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(30) NOT NULL,
    display_name text NOT NULL,
    description text DEFAULT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.document_status IS 'Status of documents.';

COMMENT ON COLUMN public.document_status.display_name IS 'User facing string';

COMMENT ON COLUMN public.document_status.description IS 'User facing string';

CREATE TABLE IF NOT EXISTS public.chunking_strategy(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name varchar(30) NOT NULL,
    display_name text NOT NULL,
    description text DEFAULT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    is_enabled boolean DEFAULT TRUE
);

COMMENT ON TABLE public.chunking_strategy IS 'Types of strategies that can be used to chunk out the text.';

COMMENT ON COLUMN public.chunking_strategy.display_name IS 'User facing string';

COMMENT ON COLUMN public.chunking_strategy.description IS 'User facing string';

COMMENT ON COLUMN public.chunking_strategy.is_enabled IS 'Tells if the strategy is enabled to be used';

CREATE TABLE IF NOT EXISTS public.documents(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    path text NOT NULL,
    status_id integer NOT NULL REFERENCES public.document_status(id) ON DELETE RESTRICT,
    chunk_strategy_id integer NOT NULL REFERENCES public.chunking_strategy(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by text NOT NULL,
    collection_id integer NOT NULL REFERENCES public.collections(id) ON DELETE RESTRICT
);

COMMENT ON TABLE public.documents IS 'Contains information about documents uploaded by users.';

COMMENT ON COLUMN public.documents.path IS 'Private storage path of the document';

CREATE OR REPLACE TRIGGER "trigger_updated_at_documents"
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.chunks(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_id integer NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    txt text NOT NULL,
    embedding extensions.vector(1536),
    prev_chunk_id integer REFERENCES public.chunks(id) ON DELETE SET NULL,
    next_chunk_id integer REFERENCES public.chunks(id) ON DELETE SET NULL,
    embedding_model varchar(30),
    CONSTRAINT if_embedding_model CHECK (NOT ((embedding IS NULL) AND (embedding_model IS NULL)))
);

COMMENT ON TABLE public.chunks IS 'Chunks of text extracted from documents';

COMMENT ON COLUMN public.chunks.txt IS 'Text string representing the chunk';

COMMENT ON COLUMN public.chunks.embedding IS 'Vector embedding created from the txt';

COMMENT ON COLUMN public.chunks.embedding_model IS 'Model used to create the embedding';

COMMENT ON COLUMN public.chunks.prev_chunk_id IS 'References the previous chunk of text. Use to traverse the document text through a linked list';

COMMENT ON COLUMN public.chunks.next_chunk_id IS 'References the next chunk of text. Use to traverse the document text through a linked list';

