import BN from 'bn.js'
import { usdDecimals } from '@aleph-indexer/solana'
import { getPythProgramKeyForCluster } from '@pythnetwork/client'

export const PYTH_PROGRAM_ID_PK = getPythProgramKeyForCluster('mainnet-beta')
export const PYTH_PROGRAM_ID = PYTH_PROGRAM_ID_PK.toBase58()

// WADS
export const usdDecimalsBN = new BN(usdDecimals)
export const usdWad = new BN(
  '1'.concat(Array(usdDecimalsBN.toNumber() + 1).join('0')),
)
export const WAD_DECIMALS = new BN(18)
export const WAD = new BN(
  '1'.concat(Array(WAD_DECIMALS.toNumber() + 1).join('0')),
)
