ALTER TABLE public.chunking_strategy ADD CONSTRAINT chunking_strategy_name_key UNIQUE (name);

ALTER TABLE public.chunking_strategy ADD COLUMN IF NOT EXISTS best_for text DEFAULT NULL;

COMMENT ON COLUMN public.chunking_strategy.best_for IS 'Describes what type of content this strategy works best for';

INSERT INTO public.chunking_strategy (name, display_name, description, best_for) VALUES
  ('paragraph', 'Paragraph', 'Splits text on paragraph boundaries', 'Choose this for articles, reports, or any document with clear paragraph breaks'),
  ('fixed', 'Fixed Size', 'Splits text into fixed-size chunks with overlap', 'Choose this for transcripts, logs, or text without natural breaks')
ON CONFLICT (name) DO UPDATE SET best_for = EXCLUDED.best_for;
