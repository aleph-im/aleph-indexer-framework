import {
  EntityStorage,
  EntityUpdateOp,
  SolanaParsedTransactionV1,
} from '@aleph-indexer/core'

export type TransactionSignatureResponse = {
  signature: string
  nonceIndexes: Record<string, number>
}

export type TransactionParsedResponse = SolanaParsedTransactionV1 &
  TransactionSignatureResponse

export type TransactionRequestResponse =
  | TransactionSignatureResponse
  | TransactionParsedResponse

export type TransactionRequestResponseStorage =
  EntityStorage<TransactionRequestResponse>

export enum TransactionRequestResponseDALIndex {
  NonceIndex = 'nonce_index',
}

const signatureKey = {
  get: (e: TransactionRequestResponse) => e.signature,
  length: EntityStorage.VariableLength,
}

const nonceKey = {
  get: (e: TransactionRequestResponse) => Object.keys(e.nonceIndexes || {}),
  length: EntityStorage.TimestampLength,
}

const indexKey = {
  get: (e: TransactionRequestResponse, [nonce]: string[]) =>
    e.nonceIndexes[nonce],
  length: 8,
}

export function createTransactionRequestResponseDAL(
  path: string,
): TransactionRequestResponseStorage {
  return new EntityStorage<TransactionRequestResponse>({
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
      oldEntity: TransactionRequestResponse | undefined,
      newEntity: TransactionRequestResponse,
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
