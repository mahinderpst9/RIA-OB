
export interface TranscriptionEntry {
  id: number;
  speaker: 'user' | 'ria';
  text: string;
  isFinal: boolean;
}
