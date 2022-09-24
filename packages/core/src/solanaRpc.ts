import { config } from './config.js'
import { SolanaRPC, SolanaRPCRoundRobin } from './solana.js'
import { PARSERS } from './parsers/index.js'

export const solanaPrivateRPCRoundRobin = new SolanaRPCRoundRobin(
  (config.SOLANA_RPC || '').split(','),
  PARSERS,
)

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC
    ? config.SOLANA_MAIN_PUBLIC_RPC.split(',')
    : ['https://api.mainnet-beta.solana.com'],
  PARSERS,
  true,
)

export const solanaPublicRPCRoundRobin = config.SOLANA_PUBLIC_RPC
  ? new SolanaRPCRoundRobin(
      config.SOLANA_PUBLIC_RPC.split(','),
      PARSERS,
      false, // true,
    )
  : solanaMainPublicRPCRoundRobin

export const solanaPrivateRPC = solanaPrivateRPCRoundRobin.getProxy()
export const solanaPublicRPC = solanaPublicRPCRoundRobin.getProxy()
export const solanaMainPublicRPC = solanaMainPublicRPCRoundRobin.getProxy()

export const solanaSerumRPC = new SolanaRPC({
  RPC_ENDPOINT: 'https://solana-api.projectserum.com',
  PARSERS,
  rateLimit: true,
})
