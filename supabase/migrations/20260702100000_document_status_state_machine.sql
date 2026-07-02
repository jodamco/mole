ALTER TABLE public.document_status ADD CONSTRAINT document_status_name_key UNIQUE (name);

INSERT INTO public.document_status (name, display_name, description) VALUES
  ('uploading', 'Uploading', 'Document file is being uploaded to storage'),
  ('uploaded', 'Uploaded', 'Document has been uploaded and is pending processing'),
  ('chunking', 'Chunking', 'Document is being split into chunks'),
  ('chunked', 'Chunked', 'Document has been chunked and is ready for embedding'),
  ('embedding', 'Embedding', 'Document chunks are being processed for embeddings'),
  ('ready', 'Ready', 'Document has been fully processed and is available for use'),
  ('error', 'Error', 'An error occurred while processing this document'),
  ('deleted', 'Deleted', 'Document has been marked as deleted');

CREATE TABLE IF NOT EXISTS public.document_status_transition(
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_status_id integer NOT NULL REFERENCES public.document_status(id) ON DELETE RESTRICT,
    to_status_id integer NOT NULL REFERENCES public.document_status(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_transition UNIQUE (from_status_id, to_status_id)
);

COMMENT ON TABLE public.document_status_transition IS 'Defines the allowed state transitions for document statuses, enforcing a state machine.';
COMMENT ON COLUMN public.document_status_transition.from_status_id IS 'The current status';
COMMENT ON COLUMN public.document_status_transition.to_status_id IS 'The next allowed status';

INSERT INTO public.document_status_transition (from_status_id, to_status_id) VALUES
  (1, 2),  -- uploading -> uploaded
  (1, 7),  -- uploading -> error
  (2, 3),  -- uploaded -> chunking
  (3, 4),  -- chunking -> chunked
  (3, 7),  -- chunking -> error
  (4, 5),  -- chunked -> embedding
  (5, 6),  -- embedding -> ready
  (5, 7),  -- embedding -> error
  (6, 8),  -- ready -> deleted
  (7, 8);  -- error -> deleted

DROP FUNCTION IF EXISTS public.check_document_status_transition();

CREATE OR REPLACE FUNCTION public.check_document_status_transition()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status_id IS DISTINCT FROM NEW.status_id
       AND NOT EXISTS (
           SELECT 1 FROM public.document_status_transition
           WHERE from_status_id = OLD.status_id
             AND to_status_id = NEW.status_id
       ) THEN
        RAISE EXCEPTION 'Invalid document status transition from % to %',
            (SELECT name FROM public.document_status WHERE id = OLD.status_id),
            (SELECT name FROM public.document_status WHERE id = NEW.status_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "trigger_check_document_status_transition"
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.check_document_status_transition();
