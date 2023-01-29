import { EntityStorage } from '@aleph-indexer/core'

export enum TransactionIndexerStateCode {
  Pending = 0,
  Ready = 1,
  Processed = 2,
}

export type TransactionIndexerState = {
  account: string
  startDate: number
  endDate: number
} & (
  | {
      state: TransactionIndexerStateCode.Processed
      requestNonce?: number
    }
  | {
      state:
        | TransactionIndexerStateCode.Pending
        | TransactionIndexerStateCode.Ready
      requestNonce: number
    }
)

export type TransactionIndexerStateStorage =
  EntityStorage<TransactionIndexerState>

export enum TransactionIndexerStateDALIndex {
  RequestState = 'request_state',
  AccountState = 'account_state',
}

const accountKey = {
  get: (e: TransactionIndexerState) => e.account,
  length: EntityStorage.AddressLength,
}

const startDateKey = {
  get: (e: TransactionIndexerState) => e.startDate,
  length: EntityStorage.TimestampLength,
}

const endDateKey = {
  get: (e: TransactionIndexerState) => e.endDate,
  length: EntityStorage.TimestampLength,
}

const stateKey = {
  get: (e: TransactionIndexerState) =>
    e.state || TransactionIndexerStateCode.Pending,
  length: 1,
}

const requestKey = {
  get: (e: TransactionIndexerState) => e.requestNonce,
  length: EntityStorage.TimestampLength,
}

export function createTransactionIndexerStateDAL(
  path: string,
): TransactionIndexerStateStorage {
  return new EntityStorage<TransactionIndexerState>({
    name: 'transaction_indexer_state',
    path,
    key: [accountKey, startDateKey, endDateKey],
    indexes: [
      {
        name: TransactionIndexerStateDALIndex.RequestState,
        key: [requestKey, stateKey],
      },
      {
        name: TransactionIndexerStateDALIndex.AccountState,
        key: [accountKey, stateKey],
      },
    ],
  })
}
