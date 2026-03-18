import { ddClient } from './ddClient';
import { TARGETS } from '../constants/targets';
import type { Target } from '../types';

export async function getAvailableTargets(): Promise<Target[]> {
  try {
    const targets = await ddClient.extension.vm!.service!.get('/api/os') as Target[];
    if (!Array.isArray(targets) || targets.length === 0) return TARGETS;
    return targets;
  } catch (error) {
    console.log('Failed to fetch OS list, using fallback', error);
    return TARGETS;
  }
}
