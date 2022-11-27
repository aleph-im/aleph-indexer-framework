import {
  getPythProgramKeyForCluster,
  parsePriceData,
  PriceData,
  PythConnection,
} from '@pythnetwork/client'
import { solanaPrivateRPC } from '@aleph-indexer/core'
import { PYTH_PROGRAM_ID_PK } from '../constants.js'
import { updPriceInstructionDiscriminator } from '../layouts/solita/index.js'
import bs58 from 'bs58'

export {
  PriceStatus,
  CorpAction,
  PriceType,
  DeriveType,
  AccountType,
  parseProductData,
  parseBaseData,
  ProductData,
  PriceData,
} from '@pythnetwork/client'

export const PYTH = new PythConnection(
  solanaPrivateRPC.getConnection(),
  getPythProgramKeyForCluster('mainnet-beta'),
)

export async function getAllPriceAccounts(): Promise<
  Record<string, PriceData>
> {
  console.log(`fetching all price accounts`)
  const connection = solanaPrivateRPC.getConnection()
  const resp = await connection.getProgramAccounts(PYTH_PROGRAM_ID_PK, {
    filters: [
      {
        memcmp: {
          bytes: bs58.encode(updPriceInstructionDiscriminator),
          offset: 0,
        },
      },
    ],
  })
  const priceAccounts: Record<string, PriceData> = {}
  for (const account of resp) {
    priceAccounts[account.pubkey.toBase58()] = parsePriceData(
      account.account.data,
    )
  }
  return priceAccounts
}

export const PriceAccounts = await getAllPriceAccounts()
