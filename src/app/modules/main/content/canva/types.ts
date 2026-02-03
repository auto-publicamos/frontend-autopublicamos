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

export interface DesignSet {
  id: string;
  img1: number | null; // Index in files
  img2: number | null; // Index in files
  img3?: number | null; // Index in files (optional for legacy/single modes)
}
