-- Add read_at column to messages table for tracking read status
ALTER TABLE messages ADD COLUMN read_at TIMESTAMPTZ;

-- Create index for better performance on read status queries
CREATE INDEX idx_messages_read_status ON messages(application_id, sender_id, read_at);
