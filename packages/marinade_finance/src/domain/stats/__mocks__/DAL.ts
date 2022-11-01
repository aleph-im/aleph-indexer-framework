import {createStatsStateDAL, createStatsTimeSeriesDAL,} from "@aleph-indexer/framework";
import {createEventDAL} from "../../../dal/event";
import {InstructionType, ParsedEvents} from "../../../utils/layouts";

export async function mockEventDAL(testName: string) {
  const eventDAL = createEventDAL(`packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}`);
  const all = await eventDAL.getAll()
  let i = 0
  for await(const event of all) {
    i++
  }
  if (i === 0) {
    const events = Array.from({length: 10}, generateEvent);
    eventDAL.save(events);
  }
  return eventDAL;
}

export function mockStatsStateDAL(testName: string) {
  return createStatsStateDAL(`packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}`);
}

export function mockStatsTimeSeriesDAL(testName: string) {
  return createStatsTimeSeriesDAL(`packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}`);
}

// get random InstructionType
function getRandomInstructionType() {
  const values = Object.values(InstructionType);
  return values[Math.floor(Math.random() * values.length)];
}

// generate random events
function generateEvent(): ParsedEvents {
  return {
    id: Math.random().toString(36).substring(2),
    account: "test",
    timestamp: Math.floor(Math.random() * Date.now()),
    type: getRandomInstructionType(),
    accounts: {} as any,
    data: {} as any,
  }
}