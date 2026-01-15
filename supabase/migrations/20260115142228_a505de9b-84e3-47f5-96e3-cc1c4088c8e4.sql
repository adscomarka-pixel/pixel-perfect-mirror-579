-- Add unique constraint for upsert operations
ALTER TABLE public.ad_accounts 
ADD CONSTRAINT ad_accounts_user_platform_account_unique 
UNIQUE (user_id, account_id, platform);