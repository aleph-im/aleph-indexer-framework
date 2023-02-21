import {
    AccountIndexerState,
    GetAccountIndexingStateRequestArgs,
    IndexerClientI,
} from "@aleph-indexer/framework";
import { DateTime, Interval } from "luxon";
import { PriceStorage } from "../../../dal/price";
import { Price } from "../../../types";
  
export async function getMockAccountState(eventDAL: PriceStorage) {
    const prices = await eventDAL.getAll()
    let earliest: Price = {} as any
    let latest: Price = {} as any
    for await (const price of prices) {
        if(price.value.timestamp < earliest.timestamp || !earliest.timestamp) {
            earliest = price.value
        }
        if(price.value.timestamp > latest.timestamp || !latest.timestamp) {
            latest = price.value
        }
    }
    return {
        getAccountState(
            args: Omit<GetAccountIndexingStateRequestArgs, "blockchainId">
        ): Promise<AccountIndexerState | undefined> {
            return Promise.resolve({
                account: '3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW',
                accurate: true,
                progress: 100,
                pending: [],
                processed: [Interval.fromDateTimes(DateTime.fromMillis(earliest.timestamp), DateTime.fromMillis(latest.timestamp)).toISO()],
            })
        }
    } as IndexerClientI
}
