import * as Types from '../types.js'
import { OrderMarketPair, TradeMarketPair } from '../types.js'

export interface GraphQLApiResolvers {
  getEvents(): Types.Event[]
}

export class GraphQLDefaultResolvers implements GraphQLApiResolvers {
  getEvents(): Types.Event[] {
    return []
  }
}

export interface GraphQLOrderBookResolvers {
  getSummary(): Types.TradingPair[]
  getTicker(): any
  getOrderBook(
    marketPair: string,
    depth: number,
    level: number,
  ): OrderMarketPair

  getTrades(marketPair: string): TradeMarketPair[]
}

export class GraphQLOrderBookDefaultResolvers
  implements GraphQLOrderBookResolvers
{
  getSummary(): Types.TradingPair[] {
    return []
  }

  getTicker(): any {
    return {}
  }

  getOrderBook(
    marketPair: string,
    depth: number,
    level: number,
  ): OrderMarketPair {
    return {
      timestamp: 0,
      bids: [],
      asks: [],
    }
  }

  getTrades(marketPair: string): TradeMarketPair[] {
    return []
  }
}
