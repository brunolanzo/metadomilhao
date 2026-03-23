-- Analytics events table for tracking user interactions
CREATE TABLE public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even anonymous) to insert events
CREATE POLICY "Anyone can insert events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Only admin can read events
CREATE POLICY "Admin can read events"
  ON public.analytics_events FOR SELECT
  USING (public.is_admin());

-- Index for fast counting by event type
CREATE INDEX idx_analytics_events_event ON public.analytics_events(event);
