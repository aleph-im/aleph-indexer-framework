import BN from 'bn.js'
import { EntityStorage } from '@aleph-indexer/core'
import { LendingEvent } from '../types.js'

const mappedProps = [
  'liquidityAmount',
  'collateralAmount',
  'liquidityFeeAmount',
  'liquidityRepayAmount',
  'collateralWithdrawAmount',
  'reserveLiquidityAmount',
  'repayReserveLiquidityAmount',
]

export type EventStorage = EntityStorage<LendingEvent>

export enum EventDALIndex {
  ReserveTimestamp = 'reserve_timestamp',
  ReserveTypeTimestamp = 'reserve_type_timestamp',
}

const idKey = {
  get: (e: LendingEvent) => e.id,
  length: EntityStorage.VariableLength,
}

const reserveKey = {
  get: (e: LendingEvent) =>
    'reserve' in e ? e.reserve : [e.repayReserve, e.withdrawReserve],
  length: EntityStorage.AddressLength,
}

const typeKey = {
  get: (e: LendingEvent) => e.type,
  length: EntityStorage.VariableLength,
}

const timestampKey = {
  get: (e: LendingEvent) => e.timestamp,
  length: EntityStorage.TimestampLength,
}

export function createEventDAL(path: string): EventStorage {
  return new EntityStorage<LendingEvent>({
    name: 'event',
    path,
    key: [idKey],
    indexes: [
      {
        name: EventDALIndex.ReserveTimestamp,
        key: [reserveKey, timestampKey],
      },
      {
        name: EventDALIndex.ReserveTypeTimestamp,
        key: [reserveKey, typeKey, timestampKey],
      },
    ],
    mapFn: async function (entry) {
      const { key, value } = entry

      // @note: Stored as hex strings (bn.js "toJSON" method), so we need to cast them to BN always
      for (const prop of mappedProps) {
        if (!(prop in value)) continue
        if ((value as any)[prop] instanceof BN) continue
        ;(value as any)[prop] = new BN((value as any)[prop], 'hex')
      }

      return { key, value }
    },
  })
}
