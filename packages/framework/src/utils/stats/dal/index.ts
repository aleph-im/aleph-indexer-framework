import {StatsState} from "./statsState.js";
import {StatsTimeSeries} from "./statsTimeSeries.js";
import {TransactionIndexerState} from "../../../services/indexer/src/dal/transactionIndexerState.js";

export * from './statsState.js'
export * from './statsTimeSeries.js'

export type StatsEntry = StatsState | StatsTimeSeries<any> | TransactionIndexerState