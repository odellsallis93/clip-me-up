import { TimestampItem, IntervalItem } from "./types";

export const SEEDED_TIMESTAMPS: TimestampItem[] = [];

export const INTERVALS: IntervalItem[] = [
  {
    name: "Minor Second (m2)",
    semitones: 1,
    description: "The closest interval. Highly dissonant and tense. Famous as the 'Jaws' theme.",
    audioFrequencyRatio: 1.05946,
    vibe: "Tension, Danger, Dread"
  },
  {
    name: "Perfect Fourth (P4)",
    semitones: 5,
    description: "Very stable, consonant, and open. Famous as the first two notes of 'Here Comes the Bride'.",
    audioFrequencyRatio: 1.33333,
    vibe: "Stability, Questioning, Open"
  },
  {
    name: "Tritone (d5)",
    semitones: 6,
    description: "Historically known as the 'Devil's Interval'. Extremely tense, unstable, and evil-sounding.",
    audioFrequencyRatio: 1.41421,
    vibe: "Conflict, Suspense, Darkness"
  },
  {
    name: "Perfect Fifth (P5)",
    semitones: 7,
    description: "The most powerful, consonant interval beside the octave. Power chords, 'Star Wars' theme.",
    audioFrequencyRatio: 1.5,
    vibe: "Power, Triumph, Clarity"
  },
  {
    name: "Major Seventh (M7)",
    semitones: 11,
    description: "Beautifully nostalgic, dreamy, and jazz-like. One semitone below the octave.",
    audioFrequencyRatio: 1.88775,
    vibe: "Dreamy, Jazzy, Nostalgic"
  }
];

export const TASTE_ELEMENTS = [
  {
    title: "Harmonic Vocabulary",
    desc: "The variety of chords and scales used. Standard pop uses 4 basic chords, while jazz and classical use complex extensions (9ths, 11ths, alterations) which create richer emotional shades."
  },
  {
    title: "Micro-Timing (The Pocket)",
    desc: "The subtle delays or anticipations (milliseconds) in play. Great drummers and guitarists play slightly behind or ahead of the beat, creating a 'laid back' or 'urgent' feel that perfect grids destroy."
  },
  {
    title: "Natural Vocal Drift",
    desc: "Singers naturally slide into notes (portamento) and have slight vibrato pitch fluctuations. Forcing these to exact frequency centers via Auto-Tune removes the vulnerability and emotional weight."
  },
  {
    title: "Dynamic Range",
    desc: "The difference between the quietest and loudest parts of a track. Modern music is often 'brickwalled' (heavily compressed to be maximum loudness), destroying the emotional rise and fall of the performance."
  }
];
