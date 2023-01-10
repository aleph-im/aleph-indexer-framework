import { IndexerClientI } from '../../interface.js'
import { BaseIndexerClient } from '../base/client.js'

export default class EthereumIndexerClient
  extends BaseIndexerClient
  implements IndexerClientI {}
