import { IndexerClientI } from '../../interface.js'
import { BaseIndexerClient } from '../base/client.js'

export default class SolanaIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI {}
