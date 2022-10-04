import { ServiceBroker } from 'moleculer'
import {
  MsIds,
  getRegistryNodesWithService,
  waitForAllNodesWithService,
} from '../common.js'
import { FetcherMsI, PrivateFetcherMsI } from './interface.js'
import {
  FetcherAccountPartitionRequestArgs,
  AddAccountInfoFetcherRequestArgs,
  FetchAccountTransactionsByDateRequestArgs,
  FetchAccountTransactionsBySlotRequestArgs,
  FetchTransactionsBySignatureRequestArgs,
  FetcherStateRequestArgs,
  FetcherState,
  SignatureFetcherState,
  TransactionState,
  CheckTransactionsRequestArgs,
} from './src/types.js'

/**
 * Client to access the main fetcher service through the broker.
 */
export class FetcherMsClient implements FetcherMsI, PrivateFetcherMsI {
  /**
   * @param broker The broker instance to retrieve the actual service from.
   * @param msId The moleculer service id of the fetcher service.
   */
  constructor(
    protected broker: ServiceBroker,
    protected msId: MsIds = MsIds.Fetcher,
  ) {}

  waitForAll(indexers: string[]): Promise<void> {
    return waitForAllNodesWithService(this.broker, indexers, this.msId)
  }

  waitForService(): Promise<void> {
    return this.broker.waitForServices(this.msId)
  }

  getAllFetchers(): string[] {
    return getRegistryNodesWithService(this.broker, this.msId)
  }

  addAccountFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.addAccountFetcher`, {
      partitionKey: args.account,
      ...args,
    })
  }

  delAccountFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.delAccountFetcher`, {
      partitionKey: args.account,
      ...args,
    })
  }

  getAccountFetcherState(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<SignatureFetcherState | undefined> {
    return this.broker.call(`${this.msId}.getAccountFetcherState`, {
      partitionKey: args.account,
      ...args,
    })
  }

  addAccountInfoFetcher(
    args: AddAccountInfoFetcherRequestArgs,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.addAccountInfoFetcher`, {
      partitionKey: args.account,
      ...args,
    })
  }

  delAccountInfoFetcher(
    args: FetcherAccountPartitionRequestArgs,
  ): Promise<void> {
    return this.broker.call(`${this.msId}.delAccountInfoFetcher`, {
      partitionKey: args.account,
      ...args,
    })
  }

  fetchAccountTransactionsByDate(
    args: FetchAccountTransactionsByDateRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.broker.call(`${this.msId}.fetchAccountTransactionsByDate`, {
      partitionKey: args.account,
      ...args,
    })
  }

  fetchAccountTransactionsBySlot(
    args: FetchAccountTransactionsBySlotRequestArgs,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.broker.call(`${this.msId}.fetchAccountTransactionsBySlot`, {
      partitionKey: args.account,
      ...args,
    })
  }

  async fetchTransactionsBySignature(
    args: FetchTransactionsBySignatureRequestArgs,
  ): Promise<void> {
    const groups = this.getTransactionPartitionGroups(args)

    await Promise.all(
      Object.entries(groups).map(([partitionKey, signatures]) => {
        return this.broker.call(`${this.msId}.fetchTransactionsBySignature`, {
          ...args,
          partitionKey,
          signatures,
        })
      }),
    )
  }

  getFetcherState(
    args: FetcherStateRequestArgs,
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
