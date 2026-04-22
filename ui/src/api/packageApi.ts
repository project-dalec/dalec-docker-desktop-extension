import { ddClient } from './ddClient';

export async function getPackages(): Promise<string[]> {
  try {
    return await ddClient.extension.vm!.service!.get('/api/packages') as string[];
  } catch (err) {
    console.error('Failed to fetch packages from backend:', err);
    return [];
  }
}
