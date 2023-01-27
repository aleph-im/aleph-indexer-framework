import { ServiceBroker } from 'moleculer'
import { Blockchain } from '../../../types.js'
import { MsIds } from '../../common.js'
import {
  BlockchainRequestArgs,
  InvokeBlockchainMethodRequestArgs,
} from '../../types.js'
import { FetcherClientI } from '../interface.js'
import {
  FetcherAccountPartitionRequestArgs,
  AddAccountStateRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  FetcherStateRequestArgs,
  FetcherState,
  TransactionState,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
  AddAccountTransactionRequestArgs,
  GetAccountTransactionStateRequestArgs,
  DelAccountTransactionRequestArgs,
  AccountTransactionHistoryState,
  GetAccountStateStateRequestArgs,
} from './types.js'

/**
 * Client to access the main fetcher service through the broker.
 */
export abstract class BaseFetcherClient implements FetcherClientI {
  /**
   * @param blockchainId The id of the blockchain the client handles
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the fetcher service.
   */
  constructor(
    protected blockchainId: Blockchain,
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Fetcher,
  ) {}

  addAccountTransactionFetcher(
    args: Omit<AddAccountTransactionRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.addAccountTransactionFetcher`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  delAccountTransactionFetcher(
    args: Omit<DelAccountTransactionRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.delAccountTransactionFetcher`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  getAccountTransactionFetcherState(
    args: Omit<
      GetAccountTransactionStateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<AccountTransactionHistoryState<unknown> | undefined> {
    return this.broker.call(`${this.msId}.getAccountTransactionFetcherState`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  addAccountStateFetcher(
    args: Omit<AddAccountStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.addAccountStateFetcher`, {
      partitionKey: args.account,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  delAccountStateFetcher(
    args: Omit<FetcherAccountPartitionRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.delAccountStateFetcher`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  getAccountStateFetcherState(
    args: Omit<GetAccountStateStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<any> {
    return this.broker.call(`${this.msId}.getAccountStateFetcherState`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  fetchAccountTransactionsByDate(
    args: Omit<
      FetchAccountTransactionsByDateRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.broker.call(`${this.msId}.fetchAccountTransactionsByDate`, {
      partitionKey: args.account,
      indexerId: this.broker.nodeID,
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  async fetchTransactionsBySignature(
    args: Omit<
      FetchTransactionsBySignatureRequestArgs,
      keyof BlockchainRequestArgs
    >,
  ): Promise<void> {
    const groups = this.getTransactionPartitionGroups(args)

    await Promise.all(
      Object.entries(groups).map(([partitionKey, signatures]) => {
        return this.broker.call(`${this.msId}.fetchTransactionsBySignature`, {
          indexerId: this.broker.nodeID,
          blockchainId: this.blockchainId,
          ...args,
          partitionKey,
          signatures,
        })
      }),
    )
  }

  getFetcherState(
    args: Omit<FetcherStateRequestArgs, keyof BlockchainRequestArgs>,
  ): Promise<FetcherState> {
    return this.broker.call(`${this.msId}.getFetcherState`, args, {
      nodeID: args.fetcher,
    })
  }

  async getTransactionState({
    signatures,
  }: CheckTransactionsRequestArgs): Promise<TransactionState[]> {
    const groups = this.getTransactionPartitionGroups({ signatures })

    const states = (await Promise.all(
      Object.entries(groups).map(([partitionKey, signatures]) => {
        return this.broker.call(`${this.msId}.getTransactionState`, {
          partitionKey,
          signatures,
        })
      }),
    )) as TransactionState[][]

    return states.flatMap((state) => state)
  }

  async delTransactionCache({
    signatures,
  }: DelTransactionsRequestArgs): Promise<void> {
    const groups = this.getTransactionPartitionGroups({ signatures })

    await Promise.all(
      Object.entries(groups).map(([partitionKey, signatures]) => {
        return this.broker.call(`${this.msId}.delTransactionCache`, {
          partitionKey,
          signatures,
        })
      }),
    )
  }

  protected invokeBlockchainMethod<R, A>(
    args: Omit<
      InvokeBlockchainMethodRequestArgs<A>,
      keyof BlockchainRequestArgs
    >,
  ): Promise<R> {
    return this.broker.call(`${this.msId}.invokeBlockchainMethod`, {
      blockchainId: this.blockchainId,
      ...args,
    })
  }

  protected getTransactionPartitionGroups(args: {
    signatures: string[]
    partitionKey?: string
  }): Record<string, string[]> {
    const partitionGroups = args.partitionKey
      ? { [args.partitionKey]: args.signatures }
      : args.signatures.reduce((acc, curr) => {
          const k = curr.charAt(0)
          const group = (acc[k] = acc[k] || [])
          group.push(curr)
          return acc
        }, {} as Record<string, string[]>)

    return partitionGroups
  }
}
