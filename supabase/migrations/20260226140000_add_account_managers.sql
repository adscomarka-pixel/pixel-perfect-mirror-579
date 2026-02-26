-- Create account_managers table
CREATE TABLE public.account_managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notion_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_managers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own account managers"
ON public.account_managers FOR ALL
USING (auth.uid() = user_id);

-- Add manager_id to clients
ALTER TABLE public.clients
ADD COLUMN manager_id UUID REFERENCES public.account_managers(id) ON DELETE SET NULL;

-- Trigger for update_at
CREATE TRIGGER update_account_managers_updated_at
BEFORE UPDATE ON public.account_managers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
