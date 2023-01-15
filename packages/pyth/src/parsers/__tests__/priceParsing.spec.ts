import priceParser from '../price'
import { AccountsType, PythEventType, UpdatePriceEvent } from '../../types'
import { AccountDomain } from '../../domain/account'
import { BN } from 'bn.js'
import { createPriceDAL } from '../../dal/price'
import { createCandles } from '../../domain/stats/timeSeries'
import { PublicKey } from '@solana/web3.js'
import {
  createStatsStateDAL,
  createStatsTimeSeriesDAL,
  IndexerMsClient,
} from '@aleph-indexer/framework/dist'
import {
  getMoleculerBroker,
  TransportType,
} from '@aleph-indexer/framework/dist/src/utils/moleculer/config'
import {
  createWorkers,
  WorkerKind,
} from '@aleph-indexer/framework/dist/src/utils/workers'

describe('Pyth: PriceParsing', () => {
  // mocking variables
  const events: UpdatePriceEvent[] = []
  events.push({
    id: '',
    timestamp: 12345,
    type: PythEventType.UpdPrice,
    account: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
    status_: 0,
    unused_: 0,
    price_: new BN(5),
    conf_: new BN(5),
    pub_slot_: new BN(5),
    accounts: {
      fundingAccount: '',
      priceAccount: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
      clockAccount: '',
    },
  })
  const channels = createWorkers([
    {
      kind: WorkerKind.Main,
      name: '',
    },
  ])
  const localBroker = getMoleculerBroker('', TransportType.Thread, {
    channels: channels[''],
  })

  const indexerMsClient = new IndexerMsClient(localBroker)
  const accountTimeSeries = createCandles(
    'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
    indexerMsClient,
    createPriceDAL(''),
    createStatsStateDAL(''),
    createStatsTimeSeriesDAL(''),
  )

  const accounts: Record<string, AccountDomain> = {}
  const account = new AccountDomain(
    {
      name: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
      programId: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
      address: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
      type: AccountsType.PriceAccount,
      data: {
        priceAccountKey: new PublicKey(
          'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
        ),
        product: {
          symbol: '',
          asset_type: '',
          quote_currency: '',
          tenor: '',
          price_account: '',
          index: '',
        },
        magic: 1,
        version: 1,
        type: 1,
        size: 1,
        priceType: 1,
        exponent: 1,
        numComponentPrices: 1,
        numQuoters: 1,
        lastSlot: new BN(5),
        validSlot: new BN(5),
        emaPrice: {
          valueComponent: new BN(5),
          value: 5,
          numerator: new BN(5),
          denominator: new BN(5),
        },
        emaConfidence: {
          valueComponent: new BN(5),
          value: 5,
          numerator: new BN(5),
          denominator: new BN(5),
        },
        timestamp: new BN(5),
        minPublishers: 5,
        drv2: 5,
        drv3: 5,
        drv4: 5,
        productAccountKey: new PublicKey(
          'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
        ),
        nextPriceAccountKey: new PublicKey(
          'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
        ),
        previousSlot: new BN(5),
        previousPriceComponent: new BN(5),
        previousPrice: 5,
        previousConfidenceComponent: new BN(5),
        previousConfidence: 5,
        previousTimestamp: new BN(5),
        priceComponents: [
          {
            publisher: new PublicKey(
              'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
            ),
            aggregate: {
              price: 5,
              priceComponent: new BN(5),
              confidenceComponent: new BN(5),
              confidence: 5,
              status: 0,
              corporateAction: 0,
              publishSlot: 5,
            },
            latest: {
              price: 5,
              priceComponent: new BN(5),
              confidenceComponent: new BN(5),
              confidence: 5,
              status: 0,
              corporateAction: 0,
              publishSlot: 5,
            },
          },
        ],
        aggregate: {
          price: 5,
          priceComponent: new BN(5),
          confidenceComponent: new BN(5),
          confidence: 5,
          status: 0,
          corporateAction: 0,
          publishSlot: 5,
        },
        price: 5,
        confidence: 5,
        status: 1,
      },
    },
    createPriceDAL(''),
    accountTimeSeries,
  )
  accounts['CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN'] = account

  it('should parse the event to get the parsed price', () => {
    const parsed = priceParser.parse(events, accounts)
    expect(parsed).toBeDefined()
    expect(parsed.price).toBeDefined()
  })
})
