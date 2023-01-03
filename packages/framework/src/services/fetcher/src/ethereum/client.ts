import { FetcherClientI } from '../../interface.js'
import { BaseFetcherClient } from '../base/client.js'

/**
 * Client to access the main fetcher service through the broker.
 */
export default class EthereumFetcherClient
  extends BaseFetcherClient
  implements FetcherClientI {}
