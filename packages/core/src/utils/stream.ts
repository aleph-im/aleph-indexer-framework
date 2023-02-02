import { Transform, TransformCallback } from 'stream'

export async function* mergeStreams(
  sources: AsyncGenerator[],
): AsyncGenerator<any, any> {
  for (const source of sources) {
    for await (const data of source) {
      yield data
    }
  }
}

export async function* mergeShuffledStreams(
  sources: AsyncGenerator[],
): AsyncGenerator<any, any> {
  if (sources.length === 1) {
    yield* sources[0]
    return
  }

  const iterators: Record<string, AsyncIterator<any>> = {}

  for (const [key, source] of sources.entries()) {
    iterators[key] = source[Symbol.asyncIterator]()
  }

  while (Object.keys(iterators).length > 0) {
    const entries = Object.entries(iterators)

    for (const [key, source] of entries) {
      if (!source) continue

      const { value, done } = await source.next()

      if (done) {
        delete iterators[key]
      }

      if (value === undefined) continue
      yield value
    }
  }
}

export async function* mergeShuffledSortedStreams<T>(
  sources: AsyncIterable<T>[],
  comparator: (a: T, b: T) => number,
): AsyncIterable<T> {
  if (sources.length === 1) {
    yield* sources[0]
    return
  }

  const nextItems: {
    it: AsyncIterator<T>
    value: T
  }[] = []

  for (const source of sources) {
    const it = source[Symbol.asyncIterator]()
    const val = await it.next()

    const value = val.value
    if (value === undefined) continue

    nextItems.push({ it, value })
  }

  while (nextItems.length) {
    nextItems.sort((a, b) => comparator(a.value, b.value))

    const first = nextItems[0]
    const second = nextItems[1]

    while (
      first.value !== undefined &&
      (second?.value === undefined ||
        comparator(first.value, second.value) <= 0)
    ) {
      yield first.value
      const val = await first.it.next()
      first.value = val.value
    }

    if (first.value === undefined) {
      nextItems.splice(0, 1)
      first.it.return && first.it.return()
    }
  }
}

export class StreamMap<I, O> extends Transform {
  constructor(protected mapFn: (item: I) => Promise<O> | O) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    })
  }

  _transform(
    input: I,
    encoding: BufferEncoding,
    next: TransformCallback,
  ): void {
    ;(async () => {
      let output

      try {
        output = await this.mapFn(input)
      } catch (e) {
        return next(e as Error)
      }

      return next(null, output)
    })()
  }
}

export class StreamFilter<I> extends Transform {
  constructor(protected filterFn: (item: I) => Promise<boolean> | boolean) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    })
  }

  _transform(
    input: I,
    encoding: BufferEncoding,
    next: TransformCallback,
  ): void {
    ;(async () => {
      let output

      try {
        output = (await this.filterFn(input)) ? input : undefined
      } catch (e) {
        return next(e as Error)
      }

      return output ? next(null, output) : next()
    })()
  }
}

export class StreamBuffer<I> extends Transform {
  protected buffer: I[] = []

  constructor(protected bufferSize: number) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    })
  }

  _transform(
    input: I | I[],
    encoding: BufferEncoding,
    next: TransformCallback,
  ): void {
    let flush = false

    try {
      if (Array.isArray(input)) {
        this.buffer.push(...input)
      } else {
        this.buffer.push(input)
      }

      flush = this.buffer.length >= this.bufferSize
    } catch (e) {
      return next(e as Error)
    }

    return flush ? this._flush(next) : next()
  }

  _flush(next: TransformCallback): void {
    if (this.buffer.length > 0) {
      const buffer = this.buffer
      this.buffer = []

      this.push(buffer)
    }

    return next()
  }
}

export class StreamUnBuffer<I> extends Transform {
  constructor() {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    })
  }

  _transform(
    input: I | I[],
    encoding: BufferEncoding,
    next: TransformCallback,
  ): void {
    try {
      if (Array.isArray(input)) {
        for (const i of input) this.push(i)
      } else {
        this.push(input)
      }
    } catch (e) {
      return next(e as Error)
    }

    return next()
  }
}
