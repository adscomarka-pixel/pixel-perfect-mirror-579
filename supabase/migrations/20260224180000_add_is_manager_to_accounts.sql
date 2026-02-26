-- Add is_manager column to ad_accounts
ALTER TABLE public.ad_accounts 
ADD COLUMN is_manager BOOLEAN DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN public.ad_accounts.is_manager IS 'Indicates if the account is an administrative/manager account (e.g., Google MCC or Meta connection point).';
