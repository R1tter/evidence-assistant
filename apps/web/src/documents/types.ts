export interface PageText {
  page: number;
  text: string;
  origin: 'embedded' | 'vision' | 'reviewed';
  uncertainties: string[];
}
export interface PagePreview {
  page: number;
  url: string;
  width: number;
  height: number;
}
export interface ReadDocument {
  pages: PageText[];
  previews: PagePreview[];
  requiresRecognition: boolean;
  dispose(): void;
}
