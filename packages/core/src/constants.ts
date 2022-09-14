import { PublicKey } from '@solana/web3.js'

// CONSTANTS from raydium-ui... might be a good idea to fetch those from their github?
export const SYSTEM_PROGRAM_ID = new PublicKey(
  '11111111111111111111111111111111',
)

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
export const TOKEN_PROGRAM_ID_PK = new PublicKey(TOKEN_PROGRAM_ID)

export const MEMO_PROGRAM_ID = new PublicKey(
  'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo',
)
export const RENT_PROGRAM_ID = new PublicKey(
  'SysvarRent111111111111111111111111111111111',
)
export const CLOCK_PROGRAM_ID = new PublicKey(
  'SysvarC1ock11111111111111111111111111111111',
)
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
)

export const WRAPPED_SOL_TOKEN_ADDRESS =
  'So11111111111111111111111111111111111111112'

export const usdDecimals = 6

export const MAX_TIMER_INTEGER = 2 ** 32 / 2 - 1
