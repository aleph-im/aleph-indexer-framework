import { EntityStorage, EntityUpdateOp } from '@aleph-indexer/core'
import { SPLTokenHolding } from '../types.js'
import { getBigNumberMapFn } from './common.js'

const mappedProps = ['deposited', 'borrowed', 'wallet', 'total']

export enum BalanceStateDALIndex {
  Mint = 'mint',
}

export type AccountBalanceStateStorage = EntityStorage<SPLTokenHolding>

const accountKey = {
  get: (e: SPLTokenHolding) => e.account,
  length: EntityStorage.AddressLength,
}

const mintKey = {
  get: (e: SPLTokenHolding) => e.tokenMint,
  length: EntityStorage.AddressLength,
}

export function createBalanceStateDAL(
  path: string,
): AccountBalanceStateStorage {
  return new EntityStorage<SPLTokenHolding>({
    name: 'account_balance_state',
    path,
    key: [mintKey, accountKey],
    indexes: [
      {
        name: BalanceStateDALIndex.Mint,
        key: [mintKey],
      },
    ],
    async updateCheckFn(
      oldEntity: SPLTokenHolding | undefined,
      newEntity: SPLTokenHolding,
    ): Promise<EntityUpdateOp> {
      if (oldEntity && oldEntity.timestamp > newEntity.timestamp) {
        return EntityUpdateOp.Keep
      }
      return EntityUpdateOp.Update
    },
    mapFn: getBigNumberMapFn(mappedProps),
  })
}
