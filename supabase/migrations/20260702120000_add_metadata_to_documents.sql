ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

COMMENT ON COLUMN public.documents.metadata IS 'Flexible metadata storage. Currently used to store error information when document processing fails.';
