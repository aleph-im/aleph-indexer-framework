import {
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
} from '@aleph-indexer/framework'
import { createPriceDAL } from '../../../dal/price'
import * as fs from 'fs'
import prices from './prices.json'
import { Price } from '../../../types'

export async function mockPriceDAL(
  testName: string,
) {
  const priceDal = createPriceDAL(
    `packages/pyth/src/domain/stats/__mocks__/data/${testName}`,
  )
  const price: Price[] = prices.prices
  await priceDal.save(price)
  
  return priceDal
}

export function mockStatsStateDAL(testName: string) {
  // delete the stats_state folder, if existent
  const path = `packages/pyth/src/domain/stats/__mocks__/data/${testName}/stats_state`
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true })
  }
  return createStatsStateDAL(
    `packages/pyth/src/domain/stats/__mocks__/data/${testName}`,
  )
}

export function mockStatsTimeSeriesDAL(testName: string) {
  // delete the stats_time_series folder, if existent
  const path = `packages/pyth/src/domain/stats/__mocks__/data/${testName}/stats_time_series`
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true })
  }
  return createStatsTimeSeriesDAL(
    `packages/pyth/src/domain/stats/__mocks__/data/${testName}`,
  )
}