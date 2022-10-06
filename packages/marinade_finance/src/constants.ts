import { PublicKey } from '@solana/web3.js'
import { config } from '@aleph-indexer/core'
import { InstructionType } from './utils/layouts/index.js'

export enum ProgramName {
  MarinadeFinance = 'marinade_finance',
}

// @todo: This is just an example, to use it on a type guard on stats folder
export const collectionEvent1 = [
  InstructionType.Initialize,
  InstructionType.ChangeAuthority,
]

export const collectionEvent1Whitelist = new Set(collectionEvent1)

export const collectionEvent2 = [
  InstructionType.AddValidator,
  InstructionType.RemoveValidator,
]

export const collectionEvent2Whitelist = new Set(collectionEvent1)

const DAY = 1000 * 60 * 60 * 24
const START_DATE = Date.now()
const SINCE_DATE = START_DATE - 7 * DAY
export const DOMAIN_CACHE_START_DATE = config.INDEX_START_DATE
  ? Number(config.INDEX_START_DATE)
  : SINCE_DATE

export const MARINADE_FINANCE_PROGRAM_ID = 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD'
export const MARINADE_FINANCE_PROGRAM_ID_PK = new PublicKey(
  MARINADE_FINANCE_PROGRAM_ID,
)
