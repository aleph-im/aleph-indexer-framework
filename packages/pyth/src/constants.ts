import BN from 'bn.js'
import { constants } from '@aleph-indexer/core'
import { getPythProgramKeyForCluster } from '@pythnetwork/client'
import { CandleInterval } from './types'

export enum ProgramName {
  Pyth = 'pyth',
}

export const PYTH_PROGRAM_ID_PK = getPythProgramKeyForCluster('mainnet-beta')
export const PYTH_PROGRAM_ID = PYTH_PROGRAM_ID_PK.toBase58()

export const TIME_FRAMES: CandleInterval[] = [
  '1minute',
  '5minute',
  '10minute',
  '15minute',
  '30minute',
  '1hour',
  '2hour',
  '3hour',
  '4hour',
  '6hour',
  '8hour',
  '12hour',
  '1day',
  '1week',
  '2week',
  '1month',
  '3month',
  '1year',
  'all',
]

// WADS
export const usdDecimals = new BN(constants.usdDecimals)
export const usdWad = new BN(
  '1'.concat(Array(usdDecimals.toNumber() + 1).join('0')),
)
export const WAD_DECIMALS = new BN(18)
export const WAD = new BN(
  '1'.concat(Array(WAD_DECIMALS.toNumber() + 1).join('0')),
)
