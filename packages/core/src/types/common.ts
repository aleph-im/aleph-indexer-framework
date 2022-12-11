// -------------- RAW EVENTS -------------------

/**
 * Defines the common properties for all events.
 */
export type EventBase<EventType> = {
  id: string
  timestamp: number
  type: EventType
  /**
   * Account where the transaction and therefore the event comes from.
   */
  account?: string
}

// ---------------- Supported blockchains --------------------------

export enum Blockchain {
  Ethereum = 'ethereum',
  Solana = 'solana',
}
