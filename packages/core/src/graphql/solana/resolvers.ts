import { TokenInfo } from '@solana/spl-token-registry'
import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID_PK } from '../../constants.js'
import * as Token from '../../token/index.js'
import {
  AlephParsedTransaction,
  AlephParsedTransactionWithAccounts,
} from '../../parsers/transaction.js'
import { SolanaRPC } from '../../solana.js'
import { SolanaTransactionLevelStorage } from '../../storage/transaction.js'
import {
  PoolDAL,
  PoolDALFactoryI,
  ReadableStorageStreamItem,
  SolanaPools,
} from '../../index.js'
import { mergeShuffledSortedStreams } from '../../utils/stream.js'

export type GetHistoryParams = {
  limit?: number
  address?: string
  reverse?: boolean
  skip?: number
  poolAddress?: string
}

export type AccountDetails = {
  address: string
  tokenAccounts: TokenDetails[]
}

export type ParsedTokenAccountInfo = {
  isNative: boolean
  mint: string
  owner: string
  state: string
  tokenAmount: number
}

export type TokenDetails = ParsedTokenAccountInfo & {
  pubkey: string
  tokenInfo?: TokenInfo
}

export abstract class SolanaGraphQLResolversBase {
  constructor(protected rpc: SolanaRPC) {}

  abstract getTransactions(
    options: GetHistoryParams,
  ): Promise<AlephParsedTransaction[]>

  async getTransaction(signature: string): Promise<AlephParsedTransaction> {
    return this.rpc.getTransaction(signature)
  }

  async getAccountDetails(address: string): Promise<AccountDetails> {
    const addressPubkey = new PublicKey(address)
    const tokenAccounts = await this.getTokensDetailsByAccount(addressPubkey)

    return {
      address,
      tokenAccounts,
    }
  }

  async getTokenList(): Promise<TokenInfo[]> {
    return Token.getTokenList()
  }

  protected async getTokensDetailsByAccount(
    publicKey: PublicKey,
  ): Promise<TokenDetails[]> {
    const programId = TOKEN_PROGRAM_ID_PK
    const { value: items } = await this.rpc
      .getConnection()
      .getParsedTokenAccountsByOwner(publicKey, { programId })

    const tokenByAddress = await Token.getTokenByAddressMap()

    return items.map((item) => {
      const parsed: ParsedTokenAccountInfo = item.account.data.parsed.info
      const tokenInfo = tokenByAddress.get(parsed.mint)
      const pubkey = item.pubkey.toBase58()

      return { ...parsed, pubkey, tokenInfo } as TokenDetails
    })
  }
}

export class SolanaGraphQLResolvers extends SolanaGraphQLResolversBase {
  constructor(
    protected transactionDAL: SolanaTransactionLevelStorage,
    protected rpc: SolanaRPC,
  ) {
    super(rpc)
  }

  async getTransactions({
    limit = 1000,
    address = undefined,
    reverse = true,
    skip = 0,
  }: GetHistoryParams): Promise<AlephParsedTransaction[]> {
    const items: AlephParsedTransaction[] = []

    const transactions = this.transactionDAL.getAll({ reverse })

    for await (const { value: data } of transactions) {
      const tx = data as unknown as AlephParsedTransactionWithAccounts

      // @note: Filter transactions which includes the given address as part of its accounts
      if (
        address &&
        !tx.accounts.find((account) => account.toString() === address)
      )
        continue

      // @note: Skip first N transactions
      if (--skip >= 0) continue

      // const transactionParser = PARSERS.transaction as TransactionParser
      // const parsedTxs = transactionParser.parse(tx)

      items.push(tx)

      // @note: Stop when after reaching the limit
      if (limit > 0 && items.length >= limit) break
    }

    return items
  }
}

export class SolanaPoolGraphQLResolvers extends SolanaGraphQLResolversBase {
  constructor(
    protected poolDALFactory: PoolDALFactoryI,
    protected pools: SolanaPools,
    protected rpc: SolanaRPC,
  ) {
    super(rpc)
  }

  async getTransactions({
    poolAddress,
    limit = 1000,
    address = undefined,
    reverse = true,
    skip = 0,
  }: GetHistoryParams): Promise<AlephParsedTransaction[]> {
    const items: AlephParsedTransaction[] = []
    let pool, transactions

    if (poolAddress) {
      pool = await this.pools.getPool(poolAddress)
      if (!pool) throw new Error(`Pool ${poolAddress} does not exists`)

      transactions = this.poolDALFactory
        .get(PoolDAL.Transaction, poolAddress)
        .getAll({ reverse })
    } else {
      const markets = await this.pools.getPools()

      const dals = Object.keys(markets).map((poolAddress) =>
        this.poolDALFactory
          .get(PoolDAL.Transaction, poolAddress)
          .getAll({ reverse }),
      )

      const op = reverse ? -1 : 1

      transactions = mergeShuffledSortedStreams(
        dals as any,
        ({ value: a }, { value: b }) => (a.slot - b.slot) * op,
      ) as AsyncGenerator<
        ReadableStorageStreamItem<string, AlephParsedTransaction>
      >
    }

    for await (const { value: data } of transactions) {
      const tx = data as unknown as AlephParsedTransactionWithAccounts

      // @note: Filter transactions which includes the given address as part of its accounts
      if (
        address &&
        !tx.accounts.find((account) => account.toString() === address)
      )
        continue

      // @note: Skip first N transactions
      if (--skip >= 0) continue

      // const transactionParser = PARSERS.transaction as TransactionParser
      // const parsedTxs = transactionParser.parse(tx)

      items.push(tx)

      // @note: Stop when after reaching the limit
      if (limit > 0 && items.length >= limit) break
    }

    return items
  }
}
