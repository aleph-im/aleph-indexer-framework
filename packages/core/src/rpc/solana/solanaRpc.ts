import { config } from '../../config.js'
import { SolanaRPC, SolanaRPCRoundRobin } from './client.js'

export const solanaPrivateRPCRoundRobin = new SolanaRPCRoundRobin(
  (config.SOLANA_RPC || '').split(','),
)

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC
    ? config.SOLANA_MAIN_PUBLIC_RPC.split(',')
    : ['https://api.mainnet-beta.solana.com'],
  true,
)

export const solanaPublicRPCRoundRobin = config.SOLANA_PUBLIC_RPC
  ? new SolanaRPCRoundRobin(
      config.SOLANA_PUBLIC_RPC.split(','),
      false, // true,
    )
  : solanaMainPublicRPCRoundRobin

export const solanaPrivateRPC = solanaPrivateRPCRoundRobin.getProxy()
export const solanaPublicRPC = solanaPublicRPCRoundRobin.getProxy()
export const solanaMainPublicRPC = solanaMainPublicRPCRoundRobin.getProxy()

export const solanaSerumRPC = new SolanaRPC({
  url: 'https://solana-api.projectserum.com',
  rateLimit: true,
})
