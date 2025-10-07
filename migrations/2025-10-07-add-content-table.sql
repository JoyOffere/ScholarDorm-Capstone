-- Create content table for file/folder management
CREATE TABLE content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('folder', 'file', 'image', 'video', 'document', 'audio', 'link')),
  size BIGINT,
  thumbnail_url TEXT,
  url TEXT,
  parent_id UUID REFERENCES content(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_content_parent_id ON content(parent_id);
CREATE INDEX idx_content_created_by ON content(created_by);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_is_published ON content(is_published);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();

-- Insert some sample content data
INSERT INTO content (title, type, created_by, parent_id, is_published) VALUES
('Course Materials', 'folder', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, true),
('Student Resources', 'folder', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, true),
('Introduction to Algebra', 'document', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, true),
('Campus Tour Video', 'video', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, true),
('Student Handbook', 'file', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, false),
('Campus Map', 'image', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, true),
('Online Learning Resources', 'link', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), NULL, true);
