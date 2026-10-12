import { createClient, type Client } from '@libsql/client';
import path from 'path';

let clientInstance: Client | null = null;

export function getDbClient(): Client {
  if (clientInstance) {
    return clientInstance;
  }

  const rawUri = process.env.DATABASE_URI || 'file:./payload.db';

  let url = rawUri;
  if (rawUri.startsWith('file:')) {
    const rawPath = rawUri.slice(5);
    const absPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath);
    url = `file:${absPath}`;
  }

  clientInstance = createClient({
    url,
  });

  return clientInstance;
}

export const db = getDbClient();
