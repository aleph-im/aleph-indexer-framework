import { InstructionContextV1 } from '@aleph-indexer/core/dist'
import { listGroupBy } from '@aleph-indexer/core/dist/utils'
import { AccountsType, PythEventType, UpdatePriceEvent } from '../../types'
import { eventParser } from '../../parsers/event'
import { priceParser } from '../../parsers/price'
import { AccountDomain } from '../account'
import { createPriceDAL, PriceDALIndex } from '../../dal/price'
import { PublicKey } from '@solana/web3.js'
import { BN } from 'bn.js'
import { createCandles } from '../../domain/stats/timeSeries'
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
import { jest } from '@jest/globals'
// jest.useFakeTimers()
jest.setTimeout(50000)

const priceDAL = createPriceDAL('')
let previousSlotBatch: UpdatePriceEvent[] = []

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

const ixsContext: InstructionContextV1[] = [
  {
    txContext: {
      tx: {
        parsed: {
          signatures: [''],
          message: {
            accountKeys: [
              {
                pubkey: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
                signer: false,
                writable: true,
                source: 'transaction',
              },
            ],
            instructions: [
              {
                program: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
                programId: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
                parsed: null as any,
                index: 1,
              },
            ],
            recentBlockhash: '53mS82y9VGFEXmF2hTWYFKqFq9ytQDT7WRpwtBAmDTQj',
          },
        },
        index: 1,
        signature:
          '35QyF76G4MGDo2Tfgea38j97vyDk5ZBrGS5s1oq3YRLMHvF9wAd84Zk7FwmYkfJ2qabAHwGYqUqmem5tDfg4x8np',
        blocktime: 1673740800,
        slot: 172610174,
        meta: null,
      },
      parserContext: {
        account: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
        startTimestamp: 0,
        endTimestamp: Date.now(),
      },
    },
    ix: {
      index: 1,
      program: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
      programId: 'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
      parsed: {
        type: PythEventType.UpdPrice,
        info: {
          status_: 0,
          unused_: 0,
          price_: new BN(1000),
          conf_: new BN(1000),
          pub_slot_: new BN(1000),
          accounts: {
            fundingAccount: '',
            priceAccount: 'CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN',
            clockAccount: '',
          },
        },
      },
    },
  },
]

async function indexInstructions(
  ixsContext: InstructionContextV1[],
): Promise<void> {
  const parsedIxs = eventParser.parse(ixsContext)

  console.log(`indexing ${ixsContext.length} parsed ixs`)

  // group by slot
  let slotBatches = Object.entries(
    listGroupBy(parsedIxs, (ix) => Number(ix.pub_slot_)),
  )

  // append previous last slot batch, if necessary
  if (
    previousSlotBatch.length > 0 &&
    Number(previousSlotBatch[0].pub_slot_) ===
      Number(slotBatches[0][1][0].pub_slot_)
  ) {
    slotBatches[0].unshift(previousSlotBatch)
  }
  previousSlotBatch = slotBatches[slotBatches.length - 1][1]
  slotBatches = slotBatches.slice(0, -1)

  // group by data feed
  const accountSlotBatches = Object.entries(
    listGroupBy(slotBatches, (batch) => batch[1][0].accounts.priceAccount),
  )

  // aggregate prices for each batch (data feed -> slot -> price)
  const parsedPrices = accountSlotBatches.flatMap((accountBatch) =>
    accountBatch[1].map((slotBatch) =>
      priceParser.parse(slotBatch[1], accounts),
    ),
  )

  await priceDAL.save(parsedPrices)
}

describe('Pyth: IndexInstructions', () => {
  it('should index instructions', async () => {
    await indexInstructions(ixsContext)

    // check database
    const prices = await priceDAL
      .useIndex(PriceDALIndex.AccountTimestamp)
      .getAllFromTo(
        ['CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN', 0],
        ['CrCpTerNqtZvqLcKqz1k13oVeXV9WkMD2zA9hBKXrsbN', Date.now()],
        {
          reverse: true,
          limit: 1000 + 0,
        },
      )

    for await (const { value } of prices) {
      expect(value.price).toBeDefined()
    }
  })
})
