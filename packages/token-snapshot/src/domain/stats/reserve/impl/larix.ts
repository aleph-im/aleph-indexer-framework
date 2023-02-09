import { LARIX_SDK } from '../../../../utils/larix-sdk.js'
import { LendingReserveStatsAggregator } from '../types.js'
import PortReserveStatsAggregator from './port.js'

export default class LarixReserveStatsAggregator
  extends PortReserveStatsAggregator
  implements LendingReserveStatsAggregator
{
  constructor(protected sdk = LARIX_SDK) {
    super(sdk)
  }
}
