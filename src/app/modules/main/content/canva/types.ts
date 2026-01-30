export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  source: 'drive' | 'local';
}

export interface Template {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: string;
}

export type UploadSource = 'drive' | 'local' | null;
