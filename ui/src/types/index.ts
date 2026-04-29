export type Family = 'deb' | 'rpm';

export interface Target {
  id: string;
  label: string;
  family: Family;
  group: string;
}

export type DepType = 'runtime' | 'build' | 'recommends' | 'test';

export interface DepTypeMeta {
  id: DepType;
  label: string;
  description: string;
}

export interface VersionConstraint {
  op: string;
  val: string;
}

export interface Package {
  name: string;
  versions: VersionConstraint[];
}

export type PackagesMap = Record<DepType, Package[]>;

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
  packages: PackagesMap;
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
