import {createStatsStateDAL, createStatsTimeSeriesDAL,} from "@aleph-indexer/framework";
import {createEventDAL} from "../../../dal/event";
import {InstructionType, ParsedEvents} from "../../../utils/layouts";
import * as fs from "fs";
import {MARINADE_FINANCE_PROGRAM_ID} from "../../../constants";

export async function mockEventDAL(testName: string) {
  const eventDAL = createEventDAL(`packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}`);
  const all = await eventDAL.getAll()
  let i = 0
  for await(const event of all) {
    i++
  }
  if (i === 0) {
    const events = Array.from({length: 1}, generateEvent);
    await eventDAL.save(events);
  }
  return eventDAL;
}

export function mockStatsStateDAL(testName: string) {
  // delete the stats_state folder, if existent
  const path = `packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}/stats_state`
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true });
  }
  return createStatsStateDAL(`packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}`);
}

export function mockStatsTimeSeriesDAL(testName: string) {
  // delete the stats_time_series folder, if existent
  const path = `packages/marinade_finance/src/domain/stats/__mocks__/data/${testName}/stats_time_series`
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true });
  }
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
    timestamp: Math.floor(Date.now() - (Math.random() * 60 * 60 * 24 * 14 * 1000)),
    type: getRandomInstructionType(),
    signer: "CNCnPo5Fhfjj5Y7DSc82RDJfQoHEd2haAnTkAwRGfo8z",
    programId: MARINADE_FINANCE_PROGRAM_ID,
    data: {} as any,
    accounts: {} as any,
  }
}