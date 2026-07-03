export interface TranscriptLine {
  id: string;
  start: number;
  duration?: number;
  text: string;
}

export interface TimestampItem {
  id: string;
  timeSeconds: number;
  timeLabel: string;
  title: string;
  category: "pitch" | "taste" | "production" | "elements" | "exposure";
  description: string;
  quote?: string;
  whyItMatters: string;
  transcript?: TranscriptLine[];
}

export interface IntervalItem {
  name: string;
  semitones: number;
  description: string;
  audioFrequencyRatio: number;
  vibe: string;
}

export type CategoryTheme = {
  bg: string;
  text: string;
  border: string;
  accent: string;
};
