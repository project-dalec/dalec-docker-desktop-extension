import { ddClient } from './ddClient';
import type { Target } from '../types';

export async function getAvailableTargets(): Promise<Target[]> {
  try {
    const targets = await ddClient.extension.vm!.service!.get('/api/os') as Target[];
    if (!Array.isArray(targets) || targets.length === 0) return [];
    return targets;
  } catch (error) {
    console.error('Failed to fetch OS list:', error);
    return [];
  }
}
