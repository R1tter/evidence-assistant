export interface Document {
  id: string;
  title: string;
  path: string;
  content: string;
}
export interface Chunk {
  provenance?: {
    page: number;
    block: number;
    revision: number;
    origin: 'embedded' | 'vision' | 'reviewed';
  };
  id: string;
  documentId: string;
  title: string;
  section: string;
  text: string;
}
export interface Evidence {
  chunk: Chunk;
  score: number;
}
export interface Retriever {
  search(question: string, limit?: number): Evidence[];
}
