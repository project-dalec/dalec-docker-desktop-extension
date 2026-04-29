export type OsFamily = 'deb' | 'rpm';

export interface OsTarget {
  id:     string;
  label:  string;
  family: OsFamily;
  group:  string;
}

export interface StartBuildPayload {
  imageName: string;
  osTarget:  string;
  yamlSpec:  string;
  packages:  string[];
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
