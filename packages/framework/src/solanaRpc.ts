import config from '../config.js'
import { SolanaRPCRoundRobin } from '@aleph-indexer/core'

export const solanaRPCRoundRobin = new SolanaRPCRoundRobin(
  [...(config.SOLANA_RPC || '').split(',')],
  {},
  false,
)

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC
    ? config.SOLANA_MAIN_PUBLIC_RPC.split(',')
    : [
        // @note: All pools has historical data
        'https://api.mainnet-beta.solana.com',
      ],
  {},
  true,
)

export const solana = solanaRPCRoundRobin.getProxy()
export const solanaMainPublic = solanaMainPublicRPCRoundRobin.getProxy()
