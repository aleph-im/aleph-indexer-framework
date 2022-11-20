import BN from 'bn.js'
import NodeCache from 'node-cache'
import { TokenInfo, TokenListProvider } from '@solana/spl-token-registry'
import { PublicKey, Connection, ParsedAccountData } from '@solana/web3.js'
import { SolanaRPC } from '../rpc/solana/client.js'
import { WRAPPED_SOL_TOKEN_ADDRESS } from '../constants.js'
import { Mutex } from '../utils/index.js'

export interface TokenCache {
  tokenList: TokenInfo[] | undefined
  tokenByAddress: Map<string, TokenInfo> | undefined
  tokenAccountToAddress: Record<string, string>
  tokenAccountInfo: Record<string, ParsedAccountData>
  tokenSupply: {
    cache: NodeCache
    mutex: Record<string, Mutex>
  }
}

export const cache: TokenCache = {
  tokenList: undefined,
  tokenByAddress: undefined,
  tokenAccountToAddress: {},
  tokenAccountInfo: {},
  tokenSupply: {
    cache: new NodeCache({
      stdTTL: 60 * 60, // 1h
      checkperiod: 60, // 1m
      useClones: false,
    }),
    mutex: {},
  },
}

export enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

async function loadTokenList(forceRefresh = false): Promise<void> {
  if (!forceRefresh && cache.tokenList) return

  const tokens = await new TokenListProvider().resolve()
  cache.tokenList = tokens.filterByClusterSlug('mainnet-beta').getList()

  cache.tokenByAddress = new Map(
    cache.tokenList.map((token) => [token.address, token]),
  )
}

export async function getTokenList(
  forceRefresh?: boolean,
): Promise<TokenInfo[]> {
  await loadTokenList(forceRefresh)
  return cache.tokenList || []
}

export async function getTokenByAddressMap(
  forceRefresh?: boolean,
): Promise<Map<string, TokenInfo>> {
  await loadTokenList(forceRefresh)
  return cache.tokenByAddress || new Map()
}

export async function getTokenAccountInfo(
  address: string,
  connection: Connection,
): Promise<ParsedAccountData | undefined> {
  let accountInfo = cache.tokenAccountInfo[address]

  if (!accountInfo) {
    const result = await connection.getParsedAccountInfo(new PublicKey(address))
    if (!result || !result.value) return

    accountInfo = result.value.data as ParsedAccountData
    cache.tokenAccountInfo[address] = accountInfo
  }

  return accountInfo
}

export async function getTokenByAddress(
  address: string,
  connection?: Connection,
  forceRefresh?: boolean,
): Promise<TokenInfo | undefined> {
  const tokenByAddressMap = await getTokenByAddressMap(forceRefresh)
  let token = tokenByAddressMap.get(address)

  if (connection) {
    const parsedAccountData = await getTokenAccountInfo(address, connection)
    if (!parsedAccountData) return token

    // @note: Some tokens has wrong decimals in solana-labs/token-list CDN list
    // causing wrong TVL calculations, take account info as the source of truth
    const { decimals } = parsedAccountData.parsed.info

    // @note: Mark unknown tokens as it
    if (!token) {
      token = {
        address,
        decimals,
        chainId: 101,
        symbol: address.substr(0, 5).toUpperCase(),
        name: 'Unknown',
      }
    }

    token = { ...token, decimals }
  }

  return token
}

export async function getToken(
  token: TokenInfo,
  connection?: Connection,
  forceRefresh?: boolean,
): Promise<TokenInfo> {
  // @note: Ensure a token always has and address prop and a chainId
  const tk = token as any
  tk.address = token.address || tk.mintAddress
  tk.chainId = token.chainId || SolanaChainId.MainnetBeta

  let tentative: TokenInfo | undefined = await getTokenByAddress(
    token.address,
    connection,
    forceRefresh,
  )

  if (!tentative) {
    tentative = {
      chainId: token.chainId,
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
    }
  }

  return tentative
}

export async function getTokenMintByAccount(
  address: string,
  connection: Connection,
): Promise<string> {
  let tokenAddress = cache.tokenAccountToAddress[address]

  if (!tokenAddress) {
    const parsedAccountData = (await getTokenAccountInfo(
      address,
      connection,
    )) as ParsedAccountData

    tokenAddress = parsedAccountData.parsed.info.mint
    cache.tokenAccountToAddress[address] = tokenAddress
  }

  return tokenAddress
}

export async function getTokenSupply(
  address: string,
  solanaRPC: SolanaRPC,
): Promise<BN> {
  const mutex = (cache.tokenSupply.mutex[address] =
    cache.tokenSupply.mutex[address] || new Mutex())

  const release = await mutex.acquire()

  try {
    const supplyCache = cache.tokenSupply.cache

    const data: BN | undefined = supplyCache.get(address)
    if (data) return data

    let result

    // @note: wrapped SOL token returns 0, calculate it by the native SOL supply
    if (address === WRAPPED_SOL_TOKEN_ADDRESS) {
      const { value } = await solanaRPC.getSupply()
      result = new BN(String(value.circulating), 10)
    } else {
      const { value } = await solanaRPC
        .getConnection()
        .getTokenSupply(new PublicKey(address))
      result = new BN(value.amount || 0, 10)
    }

    supplyCache.set(address, result)
    return result
  } finally {
    release()
  }
}

// @todo: Refactor and remove
export const get_token_list = getTokenList
export const get_token = getToken
export const get_token_address_by_account = getTokenMintByAccount
