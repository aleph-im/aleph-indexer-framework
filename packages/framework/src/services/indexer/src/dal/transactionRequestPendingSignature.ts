import { EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'

export type TransactionRequestPendingSignature = {
  signature: string
  nonces: number[]
}

export type TransactionRequestPendingSignatureStorage =
  EntityStorage<TransactionRequestPendingSignature>

export enum TransactionRequestPendingSignatureDALIndex {
  NonceSignature = 'nonce_signature',
}

const signatureKey = {
  get: (e: TransactionRequestPendingSignature) => e.signature,
  length: EntityStorage.VariableLength,
}

const nonceKey = {
  get: (e: TransactionRequestPendingSignature) => e.nonces,
  length: EntityStorage.TimestampLength,
}

export function createTransactionRequestPendingSignatureDAL(
  path: string,
): TransactionRequestPendingSignatureStorage {
  return new EntityStorage<TransactionRequestPendingSignature>({
    name: 'transaction_request_pending_signatures',
    path,
    primaryKey: [signatureKey],
    indexes: [
      {
        name: TransactionRequestPendingSignatureDALIndex.NonceSignature,
        key: [nonceKey, signatureKey],
      },
    ],
    async updateCheckFn(
      oldEntity: TransactionRequestPendingSignature | undefined,
      newEntity: TransactionRequestPendingSignature,
    ): Promise<EntityUpdateOp> {
      if (oldEntity) {
        const ts = new Set([
          ...(oldEntity.nonces || []),
          ...(newEntity.nonces || []),
        ])
        newEntity.nonces = [...ts]

        // console.log(
        //   'updated entity [transaction_request_pending_signatures]',
        //   newEntity.timestamps.length,
        // )
      }

      return EntityUpdateOp.Update
    },
  })
}
