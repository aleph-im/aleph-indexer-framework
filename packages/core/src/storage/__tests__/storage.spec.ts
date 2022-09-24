import { jest } from '@jest/globals'

// jest.useFakeTimers()
jest.setTimeout(1000 * 60)

import { EntityStorage } from '../entityStorage.js'

type MyEntity = {
  name: string
  type: string
  market: string
  account1: string
  account2: string
  timestamp: number
}

const oneMonth = 1000 * 60 * 60 * 24 * 30
const date = 1647705962386 - oneMonth * 10

function getMockedEntities(): MyEntity[] {
  return Array.from({ length: 10 }).map((_, i) => getMockedEntity(i))
}

function getMockedEntity(i: number): MyEntity {
  const rndIndx = i % 3
  const timestamp = date + i * oneMonth

  return {
    name: `entity-${i}`,
    type: ['type-1', 'type-2', 'type-3'][rndIndx],
    market: ['market-1', 'market-2', 'market-3'][rndIndx],
    account1: 'So11111111111111111111111111111111111111111',
    account2: 'So22222222222222222222222222222222222222222',
    timestamp,
  }
}

xdescribe('storage v2 integration tests', () => {
  const entities = getMockedEntities()

  it('should work as expected', async () => {
    const storage = new EntityStorage<MyEntity>({
      name: 'my-entity',
      path: 'data',
      primaryKey: [{ get: (e) => e.name, length: 10 }],
      indexes: [
        {
          name: 'market',
          key: [
            { get: (e) => e.market, length: 20 },
            { get: (e) => e.timestamp, length: 13 },
          ],
        },
        {
          name: 'timestamp',
          key: [{ get: (e) => e.timestamp, length: 13 }],
        },
        {
          name: 'account',
          key: [
            { get: (e) => e.market, length: 20 },
            { get: (e) => [e.account1, e.account2], length: 43 },
            { get: (e) => e.timestamp, length: 13 },
          ],
        },
      ],
    })

    // await storage.save(entities)

    for await (const entry of await storage.getAll()) {
      console.log('by id', entry)
    }

    console.log('-----------')

    for await (const entry of await storage.useIndex('timestamp').getAll()) {
      console.log('by timestamp', entry)
    }

    console.log('-----------')

    for await (const entry of await storage
      .useIndex('market')
      .getAllFromTo(['market-3'])) {
      console.log('by market', entry)
    }

    console.log('-----------')

    for await (const entry of await storage
      .useIndex('account')
      .getAllFromTo(
        ['market-2', 'So22222222222222222222222222222222222222222'],
        ['market-2', 'So22222222222222222222222222222222222222222'],
      )) {
      console.log('aa-----', entry)
    }

    // expect(res.toNumber()).toBe(1)
  })
})
