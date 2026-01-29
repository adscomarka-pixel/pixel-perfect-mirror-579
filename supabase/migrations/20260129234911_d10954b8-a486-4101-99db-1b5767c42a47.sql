-- Add DELETE policy for alerts table so users can delete their own alerts
CREATE POLICY "Users can delete their own alerts" 
ON public.alerts 
FOR DELETE 
USING (auth.uid() = user_id);