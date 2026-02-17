export interface Downloadable {
  id: string;
  name: string;
  size: number;
  sizeReadable: string;
  downloadUrl: string;
  expiresAt: Date;
}

export interface DownloadablesResult {
  files: Downloadable[];
}
