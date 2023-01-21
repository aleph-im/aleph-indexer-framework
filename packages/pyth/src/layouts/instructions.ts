import { PythEventType, PythOracle } from '../types.js'
import { IdlCoder } from './idlCoder.js'
import idl from '../idl.json' assert { type: 'json' }
import { Layout } from '@aleph-indexer/layout'
import { pythOracleCoder } from '@pythnetwork/client'

const idlCoder = new IdlCoder(idl as PythOracle)

export function getPythEventType(ix: Buffer): string | undefined {
  const name = pythOracleCoder().instruction.decode(ix)?.name
  if (
    name === PythEventType.UpdPriceNoFailOnError ||
    name === PythEventType.AggPrice ||
    name === PythEventType.UpdPrice
  ) {
    return name
  }
  return undefined
}

// ------------------- IX DATA LAYOUT -------------------
export const IX_DATA_LAYOUT: Partial<Record<PythEventType, Layout>> = {
  [PythEventType.UpdPrice]: idlCoder.ixLayout.get('updPrice'),
  [PythEventType.AggPrice]: idlCoder.ixLayout.get('aggPrice'),
  [PythEventType.UpdPriceNoFailOnError]: idlCoder.ixLayout.get(
    'updPriceNoFailOnError',
  ),
}

// ------------------- ACCOUNT LAYOUT -------------------
export const IX_ACCOUNTS_LAYOUT: Partial<Record<PythEventType, string[]>> = {
  [PythEventType.AggPrice]: [
    'funding_account',
    'price_account',
    'clock_account',
  ],
  [PythEventType.UpdPriceNoFailOnError]: [
    'funding_account',
    'price_account',
    'clock_account',
  ],
}
