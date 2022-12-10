import { config } from '../../config.js'
import { SolanaRPCRoundRobin } from './client.js'

const mainCluster = 'https://api.mainnet-beta.solana.com'

config.SOLANA_MAIN_PUBLIC_RPC = config.SOLANA_MAIN_PUBLIC_RPC || mainCluster
config.SOLANA_PUBLIC_RPC =
  config.SOLANA_PUBLIC_RPC || config.SOLANA_MAIN_PUBLIC_RPC
config.SOLANA_RPC = config.SOLANA_RPC || config.SOLANA_PUBLIC_RPC

export const solanaMainPublicRPCRoundRobin = new SolanaRPCRoundRobin(
  config.SOLANA_MAIN_PUBLIC_RPC.split(','),
  true,
)

export const solanaPublicRPCRoundRobin =
  config.SOLANA_PUBLIC_RPC === config.SOLANA_MAIN_PUBLIC_RPC
    ? solanaMainPublicRPCRoundRobin
    : new SolanaRPCRoundRobin(config.SOLANA_PUBLIC_RPC.split(','), false)

export const solanaPrivateRPCRoundRobin =
  config.SOLANA_RPC === config.SOLANA_MAIN_PUBLIC_RPC
    ? solanaMainPublicRPCRoundRobin
    : new SolanaRPCRoundRobin(config.SOLANA_RPC.split(','), false)

export const solanaMainPublicRPC = solanaMainPublicRPCRoundRobin.getProxy()
export const solanaPublicRPC = solanaPublicRPCRoundRobin.getProxy()
export const solanaPrivateRPC = solanaPrivateRPCRoundRobin.getProxy()
