-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create archived_messages table with vector embeddings
CREATE TABLE archived_messages (
  id TEXT PRIMARY KEY,                    -- Discord message ID
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_username TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL,       -- Original message timestamp
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding VECTOR(1536)                 -- OpenAI text-embedding-3-small
);

-- Create guild settings table
CREATE TABLE settings (
  guild_id TEXT PRIMARY KEY,
  can_archive_role_ids TEXT[],           -- Roles allowed to archive
  can_search_role_ids TEXT[],            -- Roles allowed to search
  visibility TEXT NOT NULL DEFAULT 'public', -- public | restricted
  retention_days INT                     -- NULL = no auto-delete
);

-- Create audit log table
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT,
  actor_id TEXT,                         -- User who performed action
  action TEXT,                           -- archive | search | summarize
  payload JSONB,                         -- Action-specific metadata
  ts TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
-- Vector similarity index using ivfflat with cosine distance
CREATE INDEX archived_messages_embedding_idx ON archived_messages 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Composite B-tree indexes for filtering
CREATE INDEX archived_messages_guild_channel_created_idx ON archived_messages 
(guild_id, channel_id, created_at DESC);

CREATE INDEX archived_messages_guild_author_created_idx ON archived_messages 
(guild_id, author_id, created_at DESC);

CREATE INDEX archived_messages_guild_created_idx ON archived_messages 
(guild_id, created_at DESC);

-- Audit log indexes
CREATE INDEX audit_log_guild_ts_idx ON audit_log (guild_id, ts DESC);
CREATE INDEX audit_log_actor_ts_idx ON audit_log (actor_id, ts DESC);