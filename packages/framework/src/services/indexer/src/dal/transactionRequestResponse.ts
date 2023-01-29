import { EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'
import { ParsedTransaction } from '../../../../types.js'

export type TransactionSignatureResponse = {
  signature: string
  nonceIndexes: Record<string, number>
}

export type TransactionParsedResponse<T extends ParsedTransaction<unknown>> =
  T & TransactionSignatureResponse

export type TransactionRequestResponse<T extends ParsedTransaction<unknown>> =
  | TransactionSignatureResponse
  | TransactionParsedResponse<T>

export type TransactionRequestResponseStorage<
  T extends ParsedTransaction<unknown>,
> = EntityStorage<TransactionRequestResponse<T>>

export enum TransactionRequestResponseDALIndex {
  NonceIndex = 'nonce_index',
}

const signatureKey = {
  get: (e: TransactionRequestResponse<ParsedTransaction<unknown>>) =>
    e.signature,
  length: EntityStorage.VariableLength,
}

const nonceKey = {
  get: (e: TransactionRequestResponse<ParsedTransaction<unknown>>) =>
    Object.keys(e.nonceIndexes || {}),
  length: EntityStorage.TimestampLength,
}

const indexKey = {
  get: (
    e: TransactionRequestResponse<ParsedTransaction<unknown>>,
    [nonce]: string[],
  ) => e.nonceIndexes[nonce],
  length: 8,
}

export function createTransactionRequestResponseDAL<
  T extends ParsedTransaction<unknown>,
>(path: string): TransactionRequestResponseStorage<T> {
  return new EntityStorage<TransactionRequestResponse<T>>({
    name: 'transaction_request_responses',
    path,
    key: [signatureKey],
    indexes: [
      {
        name: TransactionRequestResponseDALIndex.NonceIndex,
        key: [nonceKey, indexKey],
      },
    ],
    async updateCheckFn(
      oldEntity: TransactionRequestResponse<T> | undefined,
      newEntity: TransactionRequestResponse<T>,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        const nonceIndexes = {
          ...oldEntity.nonceIndexes,
          ...newEntity.nonceIndexes,
        }

        if (!('parsed' in newEntity) && 'parsed' in oldEntity) {
          Object.assign(newEntity, oldEntity)
        }

        newEntity.nonceIndexes = nonceIndexes

        // console.log(
        //   'updated entity [transaction_request_responses]',
        //   newEntity.timestampIndexes.length,
        // )
      }

      return EntityUpdateOp.Update
    },
  })
}
