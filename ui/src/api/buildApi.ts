import { ddClient } from './ddClient';
import type { BuildStatusResponse, StartBuildPayload } from '../types';

// The Docker Desktop SDK marks vm/service as optional in its types, but they
// are always present at runtime inside a Docker Desktop extension.
const svc = () => ddClient.extension.vm!.service!;

export async function startBuild(payload: StartBuildPayload): Promise<{ buildId: string }> {
  return svc().post('/api/build', payload) as Promise<{ buildId: string }>;
}

export async function getBuildStatus(buildId: string): Promise<BuildStatusResponse> {
  return svc().get(`/api/build/${buildId}/status`) as Promise<BuildStatusResponse>;
}
