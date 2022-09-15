import { config } from './config.js'
import { SolanaRPC, SolanaRPCRoundRobin } from './solana.js'
import { PARSERS } from './parsers/index.js'

export const solanaPrivateRPCRoundRobin = new SolanaRPCRoundRobin(
  (config.SOLANA_RPC || '').split(','),
  PARSERS,
)

const solanaGenesysgoRPC = new SolanaRPC({
  RPC_ENDPOINT: 'https://aleph.genesysgo.net',
  PARSERS,
  rateLimit: false,
})

export const solanaPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_PUBLIC_RPC
    ? config.SOLANA_PUBLIC_RPC.split(',')
    : [
        // @note: Let the main server just for owner discovery (until we have our own big table with historical tx access)
        'https://api.mainnet-beta.solana.com',
        // 'https://api.devnet.solana.com',
        // 'https://solana-api.projectserum.com', (not working, random 502 Bad Gateway)
        // solanaGenesysgoRPC,
      ],
  PARSERS,
  false, // true,
)

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC
    ? config.SOLANA_MAIN_PUBLIC_RPC.split(',')
    : [
        // @note: Both pools has historical data
        'https://api.mainnet-beta.solana.com',
        // 'https://free.rpcpool.com', // same cluster than "api.mainnet-beta.solana.com" (rate limit)
        // 'https://lon22.rpcpool.com', // same cluster than "api.mainnet-beta.solana.com" (rate limit)
      ],
  PARSERS,
  true,
)

export const solanaPrivateRPC = solanaPrivateRPCRoundRobin.getProxy()
export const solanaPublicRPC = solanaPublicRPCRoundRobin.getProxy()
export const solanaMainPublicRPC = solanaMainPublicRPCRoundRobin.getProxy()

export const solanaSerumRPC = new SolanaRPC({
  RPC_ENDPOINT: 'https://solana-api.projectserum.com',
  PARSERS,
  rateLimit: true,
})
