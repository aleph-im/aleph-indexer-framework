import { FetcherClientI } from '../../interface.js'
import {
  TransactionState,
  CheckTransactionsRequestArgs,
  DelTransactionsRequestArgs,
} from '../../src/base/types.js'
import { FetchAccountTransactionsBySlotRequestArgs } from '../../src/solana/types.js'
import { BaseFetcherClient } from '../base/client.js'

/**
 * Client to access the main fetcher service through the broker.
 */
export default class FetcherClient
  extends BaseFetcherClient
  implements FetcherClientI
{
  async fetchAccountTransactionsBySlot(
    args: Omit<FetchAccountTransactionsBySlotRequestArgs, 'blockchainId'>,
  ): Promise<void | AsyncIterable<string[]>> {
    return this.invokeBlockchainMethod({
      partitionKey: args.account,
      method: 'fetchAccountTransactionsBySlot',
      args: {
        indexerId: this.broker.nodeID,
        ...args,
      },
    })
  }

  async getTransactionState({
    signatures,
  }: CheckTransactionsRequestArgs): Promise<TransactionState[]> {
    const groups = this.getTransactionPartitionGroups({ signatures })

    const states = (await Promise.all(
      Object.entries(groups).map(([partitionKey, signatures]) => {
        return this.invokeBlockchainMethod({
          partitionKey,
          method: 'getTransactionState',
          args: { signatures },
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
        return this.invokeBlockchainMethod({
          partitionKey,
          method: 'delTransactionCache',
          args: { signatures },
        })
      }),
    )
  }
}
