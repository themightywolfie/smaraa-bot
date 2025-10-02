/**
 * Database model types matching the PostgreSQL schema
 */

export interface ArchivedMessage {
  id: string; // Discord message ID
  guild_id: string;
  channel_id: string;
  author_id: string;
  author_username: string;
  content: string;
  attachments: AttachmentInfo[];
  created_at: Date;
  archived_at: Date;
  embedding: number[]; // 1536-dimensional vector
}

export interface AttachmentInfo {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
}

export interface GuildSettings {
  guild_id: string;
  can_archive_role_ids: string[];
  can_search_role_ids: string[];
  visibility: 'public' | 'restricted';
  retention_days?: number;
}

export interface AuditLogEntry {
  id: number;
  guild_id: string;
  actor_id: string;
  action: 'archive' | 'search' | 'summarize';
  payload: Record<string, any>;
  ts: Date;
}

/**
 * Database row types (as returned from queries)
 */
export interface ArchivedMessageRow {
  id: string;
  guild_id: string;
  channel_id: string;
  author_id: string;
  author_username: string;
  content: string;
  attachments: any; // JSONB
  created_at: string; // ISO timestamp
  archived_at: string; // ISO timestamp
  embedding: string; // Vector as string
}

export interface GuildSettingsRow {
  guild_id: string;
  can_archive_role_ids: string[] | null;
  can_search_role_ids: string[] | null;
  visibility: string;
  retention_days: number | null;
}

export interface AuditLogRow {
  id: string; // BIGSERIAL as string
  guild_id: string;
  actor_id: string;
  action: string;
  payload: any; // JSONB
  ts: string; // ISO timestamp
}