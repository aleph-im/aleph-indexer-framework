import BN from 'bn.js'
import { constants } from '@aleph-indexer/core'
import { getPythProgramKeyForCluster } from '@pythnetwork/client'
import { CandleInterval } from './types'
import { MAX_TIMEFRAME } from "@aleph-indexer/framework";
import {Duration} from "luxon";

export enum ProgramName {
  Pyth = 'pyth',
}

export const PYTH_PROGRAM_ID_PK = getPythProgramKeyForCluster('mainnet-beta')
export const PYTH_PROGRAM_ID = PYTH_PROGRAM_ID_PK.toBase58()

export const TIME_FRAMES: CandleInterval[] = [
  'minute1',
  'minute5',
  'minute10',
  'minute15',
  'minute30',
  'hour1',
  'hour2',
  'hour3',
  'hour4',
  'hour6',
  'hour8',
  'hour12',
  'day1',
  'week1',
  'week2',
  'month1',
  'month3',
  'year1',
  'all',
]

export const TIME_FRAMES_AS_DURATION = TIME_FRAMES.map((tf) => {
  if(tf === 'all') {
    return MAX_TIMEFRAME
  } else if (tf.startsWith('year')) {
    return Duration.fromObject({year: parseInt(tf.replace('year', ''))})
  } else if (tf.startsWith('month')) {
    return Duration.fromObject({month: parseInt(tf.replace('month', ''))})
  } else if (tf.startsWith('week')) {
    return Duration.fromObject({week: parseInt(tf.replace('week', ''))})
  } else if (tf.startsWith('day')) {
    return Duration.fromObject({day: parseInt(tf.replace('day', ''))})
  } else if (tf.startsWith('hour')) {
    return Duration.fromObject({hour: parseInt(tf.replace('hour', ''))})
  } else if (tf.startsWith('minute')) {
    return Duration.fromObject({minute: parseInt(tf.replace('minute', ''))})
  } else if (tf.startsWith('second')) {
    return Duration.fromObject({second: parseInt(tf.replace('second', ''))})
  } else {
    throw new Error(`Unknown time frame ${tf}`)
  }
})

// WADS
export const usdDecimals = new BN(constants.usdDecimals)
export const usdWad = new BN(
  '1'.concat(Array(usdDecimals.toNumber() + 1).join('0')),
)
export const WAD_DECIMALS = new BN(18)
export const WAD = new BN(
  '1'.concat(Array(WAD_DECIMALS.toNumber() + 1).join('0')),
)
