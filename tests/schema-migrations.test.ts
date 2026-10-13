import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Schema & Migration Parity Audit', () => {
  const schemaPath = path.resolve(__dirname, '../scripts/schema-postgres.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  it('contains biography column in guests table definition', () => {
    expect(schemaSql).toMatch(/CREATE TABLE IF NOT EXISTS guests/);
    expect(schemaSql).toMatch(/biography TEXT/);
  });

  it('contains bio column for backward compatibility in guests table', () => {
    expect(schemaSql).toMatch(/bio TEXT/);
  });

  it('contains portrait and link metadata columns in guests table', () => {
    expect(schemaSql).toMatch(/portrait_alt TEXT/);
    expect(schemaSql).toMatch(/portrait_credit TEXT/);
    expect(schemaSql).toMatch(/links_linkedin TEXT/);
    expect(schemaSql).toMatch(/links_website TEXT/);
    expect(schemaSql).toMatch(/links_other TEXT/);
  });

  it('contains thumbnail_url and thumbnail_u_r_l in media table', () => {
    expect(schemaSql).toMatch(/CREATE TABLE IF NOT EXISTS media/);
    expect(schemaSql).toMatch(/thumbnail_url TEXT/);
    expect(schemaSql).toMatch(/thumbnail_u_r_l TEXT/);
  });

  it('contains consent and delivery tracking in nominations table', () => {
    expect(schemaSql).toMatch(/CREATE TABLE IF NOT EXISTS nominations/);
    expect(schemaSql).toMatch(/internal_notes TEXT/);
    expect(schemaSql).toMatch(/consent INTEGER/);
    expect(schemaSql).toMatch(/consent_timestamp TEXT/);
    expect(schemaSql).toMatch(/email_delivery_failed INTEGER/);
  });

  it('contains consent and delivery tracking in contact_messages table', () => {
    expect(schemaSql).toMatch(/CREATE TABLE IF NOT EXISTS contact_messages/);
    expect(schemaSql).toMatch(/consent INTEGER/);
    expect(schemaSql).toMatch(/consent_timestamp TEXT/);
    expect(schemaSql).toMatch(/email_delivery_failed INTEGER/);
  });

  it('contains host and branding media foreign key columns in site_settings', () => {
    expect(schemaSql).toMatch(/CREATE TABLE IF NOT EXISTS site_settings/);
    expect(schemaSql).toMatch(/logo_id INTEGER REFERENCES media/);
    expect(schemaSql).toMatch(/default_og_image_id INTEGER REFERENCES media/);
    expect(schemaSql).toMatch(/host_portrait_id INTEGER REFERENCES media/);
  });

  it('contains schema_migrations table for version tracking', () => {
    expect(schemaSql).toMatch(/CREATE TABLE IF NOT EXISTS schema_migrations/);
    expect(schemaSql).toMatch(/version TEXT UNIQUE NOT NULL/);
  });
});

describe('Media Storage & Resolution', () => {
  it('finds existing media files in storage directories', async () => {
    const { findMediaFile } = await import('../src/lib/storage');
    // Test that the placeholder file can be located
    const file = findMediaFile('portrait-placeholder.svg');
    expect(file).not.toBeNull();
  });
});
