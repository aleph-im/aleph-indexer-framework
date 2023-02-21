import { PriceStorage } from '../../../dal/price.js'
import { Blockchain, IndexerClientI, IndexerMsClient } from '@aleph-indexer/framework'
import { createCandles } from '../timeSeries.js'
import { mockStatsStateDAL, mockStatsTimeSeriesDAL } from '../__mocks__/DAL.js'
import { solanaIndexerClientFactory } from '@aleph-indexer/solana/index.js'
import { localBroker } from './workers.js'
import { getMockAccountState } from './indexer.js'

export async function mockAccountStats(
    eventDAL: PriceStorage,
    account: string,
    testName: string,
) {
    const statsStateDAL = mockStatsStateDAL(testName)
    const statsTimeSeriesDAL = mockStatsTimeSeriesDAL(testName)

    const blockchains: Record<Blockchain, IndexerClientI> = {
        solana: await solanaIndexerClientFactory(Blockchain.Solana, localBroker),
        ethereum: await solanaIndexerClientFactory(Blockchain.Ethereum, localBroker),
    }

    blockchains[Blockchain.Solana] = await getMockAccountState(eventDAL)
    
    const indexerMsClient: IndexerMsClient = new IndexerMsClient(localBroker, blockchains)

    return createCandles(
        Blockchain.Solana,
        account,
        indexerMsClient,
        eventDAL,
        statsStateDAL,
        statsTimeSeriesDAL,
    )
}