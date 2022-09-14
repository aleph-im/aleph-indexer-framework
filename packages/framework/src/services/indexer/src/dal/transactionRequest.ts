import { EntityStorage } from '@aleph-indexer/core'

export enum TransactionRequestType {
  ByDateRange = 0,
  BySlotRange = 1,
  BySignatures = 2,
}

export type TransactionRequestDateRange = {
  type: TransactionRequestType.ByDateRange
  params: { account: string; startDate: number; endDate: number }
}

export type TransactionRequestSlotRange = {
  type: TransactionRequestType.BySlotRange
  params: { account: string; startSlot: number; endSlot: number }
}

export type TransactionRequestSignatures = {
  type: TransactionRequestType.BySignatures
  params: { signatures: string[] }
}

export type TransactionRequestParams =
  | TransactionRequestDateRange
  | TransactionRequestSlotRange
  | TransactionRequestSignatures

export type TransactionRequest = {
  nonce: number
  complete?: boolean
  // type: TransactionRequestType
  // params: TransactionRequestParams
} & TransactionRequestParams

export type TransactionRequestStorage = EntityStorage<TransactionRequest>

const nonceKey = {
  get: (e: TransactionRequest) => e.nonce,
  length: EntityStorage.TimestampLength,
}

export function createTransactionRequestDAL(
  path: string,
): TransactionRequestStorage {
  return new EntityStorage<TransactionRequest>({
    name: 'transaction_requests',
    path,
    primaryKey: [nonceKey],
  })
}
