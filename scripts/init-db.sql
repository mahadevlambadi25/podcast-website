-- Enable extensions required for fast trigram and accent-insensitive full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
