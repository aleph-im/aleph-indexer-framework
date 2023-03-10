import {
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
} from '@aleph-indexer/framework'
import { createEventDAL } from '../../../dal/event'
import { InstructionType, ParsedEvents } from '../../../utils/layouts'
import * as fs from 'fs'
import { BRICK_PROGRAM_ID } from '../../../constants'
import { DateTime, Interval } from 'luxon'

export async function mockEventDAL(
  testName: string,
  eventConfig: { interval?: Interval; eventCnt: number },
) {
  const eventDAL = createEventDAL(
    `packages/brick/src/domain/stats/__mocks__/data/${testName}`,
  )
  const all = await eventDAL.getAll()
  let i = 0
  for await (const event of all) {
    i++
  }
  if (i === 0 || i < eventConfig.eventCnt) {
    const events = Array.from(
      { length: eventConfig.eventCnt - i },
      generateEvent.bind(null, eventConfig.interval),
    )
    await eventDAL.save(events)
  }
  return eventDAL
}

export function mockStatsStateDAL(testName: string) {
  // delete the stats_state folder, if existent
  const path = `packages/brick/src/domain/stats/__mocks__/data/${testName}/stats_state`
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true })
  }
  return createStatsStateDAL(
    `packages/brick/src/domain/stats/__mocks__/data/${testName}`,
  )
}

export function mockStatsTimeSeriesDAL(testName: string) {
  // delete the stats_time_series folder, if existent
  const path = `packages/brick/src/domain/stats/__mocks__/data/${testName}/stats_time_series`
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true })
  }
  return createStatsTimeSeriesDAL(
    `packages/brick/src/domain/stats/__mocks__/data/${testName}`,
  )
}

// get random InstructionType
function getRandomInstructionType() {
  const values = Object.values(InstructionType)
  return values[Math.floor(Math.random() * values.length)]
}

// generate random events
function generateEvent(interval?: Interval): ParsedEvents {
  if (!interval) {
    interval = Interval.fromDateTimes(new Date(2019, 1, 1), DateTime.now())
  }
  const timestamp = interval.start
    .plus({
      milliseconds: Math.floor(Math.random() * interval.length('milliseconds')),
    })
    .toMillis()
  return {
    id: Math.random().toString(36).substring(2),
    account: 'test',
    timestamp,
    type: getRandomInstructionType(),
    signer: 'CNCnPo5Fhfjj5Y7DSc82RDJfQoHEd2haAnTkAwRGfo8z',
    programId: BRICK_PROGRAM_ID,
    data: {} as any,
    accounts: {} as any,
  }
}
