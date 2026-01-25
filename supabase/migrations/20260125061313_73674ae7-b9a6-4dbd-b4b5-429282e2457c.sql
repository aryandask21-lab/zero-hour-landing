-- Fix permissive RLS policy for notifications INSERT
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Replace with proper authenticated user policy
CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  user_id IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR public.is_admin()
    OR public.is_organizer_or_admin()
  )
);