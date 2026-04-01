-- Tabela para armazenar resumos gerados de grupos WhatsApp
CREATE TABLE IF NOT EXISTS group_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_days INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE group_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
  ON group_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON group_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries"
  ON group_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- Campo para armazenar a URL do webhook n8n de resumo
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS n8n_summary_webhook_url TEXT;
