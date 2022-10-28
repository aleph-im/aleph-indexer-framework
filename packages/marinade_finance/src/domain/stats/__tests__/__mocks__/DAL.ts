import {
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
} from "@aleph-indexer/framework";
import {createEventDAL} from "../../../../dal/event";
import {opendir} from "fs";
import {InstructionType, ParsedEvents} from "../../../../utils/layouts";

export async function mockEventDAL() {
  // create a new event storage
  const eventDAL = createEventDAL("packages/marinade_finance/src/domain/stats/__tests__/__mocks__/data");
  // generate 100 random events
  const events = Array.from({length: 100}, generateEvent);
  // insert them into the event storage
  eventDAL.save(events);
  return eventDAL;
}

export function mockStatsStateDAL() {
  return createStatsStateDAL("packages/marinade_finance/src/domain/stats/__tests__/__mocks__/data");
}

export function mockStatsTimeSeriesDAL() {
  return createStatsTimeSeriesDAL("packages/marinade_finance/src/domain/stats/__tests__/__mocks__/data");
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