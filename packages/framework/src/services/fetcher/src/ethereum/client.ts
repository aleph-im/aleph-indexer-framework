import { FetcherClientI } from '../../interface.js'
import { BaseFetcherClient } from '../base/client.js'

export default class EthereumFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI {}
