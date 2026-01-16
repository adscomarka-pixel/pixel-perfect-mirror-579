-- Create table for n8n webhook integrations
CREATE TABLE public.webhook_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'n8n Webhook',
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_on_low_balance BOOLEAN DEFAULT true,
  trigger_on_token_expiry BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own webhooks"
ON public.webhook_integrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks"
ON public.webhook_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
ON public.webhook_integrations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
ON public.webhook_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_webhook_integrations_updated_at
BEFORE UPDATE ON public.webhook_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();