import { Blockchain, EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'

export type TransactionRequestPendingSignature = {
  blockchainId: Blockchain
  signature: string
  nonces: number[]
}

export type TransactionRequestPendingSignatureStorage =
  EntityStorage<TransactionRequestPendingSignature>

export enum TransactionRequestPendingSignatureDALIndex {
  BlockchainNonceSignature = 'blockchain_nonce_signature',
}

const blockchainKey = {
  get: (e: TransactionRequestPendingSignature) => e.blockchainId,
  length: EntityStorage.VariableLength,
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
    key: [blockchainKey, signatureKey],
    indexes: [
      {
        name: TransactionRequestPendingSignatureDALIndex.BlockchainNonceSignature,
        key: [blockchainKey, nonceKey, signatureKey],
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
