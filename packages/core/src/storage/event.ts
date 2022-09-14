import BN from 'bn.js'
import { LevelStorage, LevelStorageOptions } from './common.js'

export type EventKeyInfo = {
  timestamp: number
  id: string
}

export class EventLevelStorage<T extends EventKeyInfo> extends LevelStorage<
  string,
  T
> {
  constructor(
    name: string,
    options?: LevelStorageOptions<string, T>,
    mappedProps?: string[],
  ) {
    super(name, {
      ...options,
      async mapFn(entry) {
        const { key, value } = entry

        // @note: Stored as hex strings (bn.js "toJSON" method), so we need to cast them to BN always
        if (mappedProps) {
          for (const prop of mappedProps) {
            if (!(prop in value)) continue
            if ((value as any)[prop] instanceof BN) continue
            ;(value as any)[prop] = new BN((value as any)[prop], 'hex')
          }
        }

        return { key, value }
      },
    })
  }

  getKey(entity: T | EventKeyInfo): string {
    return EventLevelStorage.getKey(entity)
  }

  getValue(entity: T): T {
    return entity
  }

  getKeyInfo(key: string): EventKeyInfo {
    return EventLevelStorage.getKeyInfo(key)
  }

  static getKey(entity: EventKeyInfo): string {
    // @note: timestamps in millis has 13 digits or less
    const timestamp = String(entity.timestamp).padStart(13, '0')

    return `${timestamp}_${entity.id}`
  }

  static getKeyInfo(key: string): EventKeyInfo {
    const [timestamp, id] = key.split('_')

    return {
      timestamp: Number(timestamp),
      id,
    }
  }
}
