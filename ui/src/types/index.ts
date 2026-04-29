export type Family = 'deb' | 'rpm';

export interface Target {
  id: string;
  label: string;
  family: Family;
  group: string;
}

export interface VersionConstraint {
  op: string;
  val: string;
}

export interface Package {
  name: string;
  versions: VersionConstraint[];
}

export interface KVItem {
  key: string;
  value: string;
}

export interface ImageSpec {
  name: string;
  version: string;
  description: string;
  website: string;
  revision: string;
  license: string;
  target: Target | null;
  packages: Package[];
  entrypoint: string;
  cmd: string;
  workdir: string;
  user: string;
  envVars: KVItem[];
  labels: KVItem[];
}

export interface BuildResult {
  imageName: string;
  osTarget: string;
  packages: string[];
  digest?: string;
  finishedAt: number;
}

export interface BuildStatusResponse {
  buildId: string;
  status: 'running' | 'completed' | 'failed';
  logs: string[];
  imageName?: string;
  osTarget?: string;
  packages?: string[];
  digest?: string;
  error?: string;
}

export interface StartBuildPayload {
  imageName: string;
  osTarget:  string;
  yamlSpec:  string;
  packages:  string[];
}
