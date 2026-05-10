
-- Add game column to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS game TEXT NOT NULL DEFAULT 'Tactical FPS';

-- Seed BGMI maps in map_pool
INSERT INTO public.map_pool (game, map_name, is_active)
VALUES 
  ('BGMI', 'Erangel', true),
  ('BGMI', 'Miramar', true),
  ('BGMI', 'Sanhok', true),
  ('BGMI', 'Vikendi', true),
  ('BGMI', 'Livik', true),
  ('BGMI', 'Karakin', true),
  ('BGMI', 'Nusa', true)
ON CONFLICT DO NOTHING;
