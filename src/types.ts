export interface Script {
  id: string
  /** Full text. The first line is the Title (never blacked out); the rest is the body. */
  body: string
  /** Lifetime total Reads — never resets. */
  readCount: number
  /** Most Blackouts ever reached on this Script — survives Reset. */
  highScore: number
  /** Eligible body-word indices currently hidden this Round. */
  blackouts: number[]
  /** Timestamp (ms) of every Read, for the stats/streak graph. */
  reads: number[]
  createdAt: number
  updatedAt: number
}
