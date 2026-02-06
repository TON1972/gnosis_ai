-- Create table for dashboard settings
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id SERIAL PRIMARY KEY,
  video_url TEXT,
  video_title TEXT,
  show_video BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initialize with default row to avoid empty fetch issues
INSERT INTO dashboard_settings (id, video_url, video_title, show_video)
VALUES (1, '', '', false)
ON CONFLICT (id) DO NOTHING;
