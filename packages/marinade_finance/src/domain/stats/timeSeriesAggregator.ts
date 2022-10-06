import {
  ParsedEvents,
  MarinadeFinanceInfo,
  EventType1Info,
  EventType2Info,
  InitializeEvent,
  ChangeAuthorityEvent,
  AddValidatorEvent,
  RemoveValidatorEvent,
} from '../../types.js'
import {
  collectionEvent1Whitelist,
  collectionEvent2Whitelist,
} from '../../constants.js' // @todo: set to discriminate different event collections

// @todo: This is just an example to group some related instructions and process the data together
type CollectionEvent1 = InitializeEvent & ChangeAuthorityEvent
type CollectionEvent2 = AddValidatorEvent & RemoveValidatorEvent

export class MarinadeFinanceEventTimeSeriesAggregator {
  aggregate(
    curr: ParsedEvents | MarinadeFinanceInfo,
    prev?: MarinadeFinanceInfo,
  ): MarinadeFinanceInfo {
    prev = this.prepareMarinadeFinanceInfoItem(prev)

    if (this.isMarinadeFinanceEvent(curr)) {
      if (this.isCollectionEvent1(curr)) {
        const info = this.prepareEventType1Info(curr)
        this.processEventType1Info(prev, info)
      }

      if (this.isCollectionEvent1(curr)) {
        const info = this.prepareEventType2Info(curr)
        this.processEventType2Info(prev, info)
      }
    } else {
      const info = this.prepareMarinadeFinanceInfoItem(curr)
      this.processMarinadeFinanceInfo(prev, info)
    }

    return prev
  }

  protected prepareMarinadeFinanceInfoItem(
    info?: MarinadeFinanceInfo,
  ): MarinadeFinanceInfo {
    info = info || {
      customProperties1: 0,
      customProperties2: 0,
    }

    return info
  }

  protected prepareEventType1Info(event: CollectionEvent1): EventType1Info {
    return {
      customProperties1: 0,
    }
  }

  protected prepareEventType2Info(event: CollectionEvent2): EventType2Info {
    return {
      customProperties2: 0,
    }
  }

  // @note: We assume that curr data is sorted by time
  protected processMarinadeFinanceInfo(
    acc: MarinadeFinanceInfo,
    curr: MarinadeFinanceInfo,
  ): MarinadeFinanceInfo {
    this.processEventType1Info(acc, curr)
    this.processEventType2Info(acc, curr)

    return acc
  }

  protected processEventType1Info(
    acc: MarinadeFinanceInfo,
    curr: EventType1Info,
  ): MarinadeFinanceInfo {
    acc.customProperties1 += curr.customProperties1

    return acc
  }

  protected processEventType2Info(
    acc: MarinadeFinanceInfo,
    curr: EventType2Info,
  ): MarinadeFinanceInfo {
    acc.customProperties2 += curr.customProperties2

    return acc
  }

  protected isMarinadeFinanceEvent(
    event: ParsedEvents | MarinadeFinanceInfo,
  ): event is ParsedEvents {
    return 'type' in event
  }

  protected isCollectionEvent1(event: ParsedEvents): event is CollectionEvent1 {
    return collectionEvent1Whitelist.has(event.type)
  }

  protected isCollectionEvent2(event: ParsedEvents): event is CollectionEvent1 {
    return collectionEvent2Whitelist.has(event.type)
  }
}

export const eventAggregator = new MarinadeFinanceEventTimeSeriesAggregator()
export default eventAggregator
