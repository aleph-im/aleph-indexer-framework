import { Transform, TransformCallback, Writable } from 'node:stream'

export class StoreBackupEncoder extends Transform {
  protected count = 0

  constructor(protected name: string) {
    super({ objectMode: true })
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    next: TransformCallback,
  ): void {
    ;(async () => {
      try {
        this.count++
        if (!(this.count % 10000)) console.log(this.name, this.count)

        const line = `${JSON.stringify(chunk)}\n`
        return next(null, line)
      } catch (e) {
        return next(e as Error)
      }
    })()
  }
}

export class StoreBackupDecoder extends Transform {
  protected count = 0
  protected lastLine: string | undefined

  constructor(protected name: string) {
    super({ objectMode: true })
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    next: TransformCallback,
  ): void {
    ;(async () => {
      try {
        const text = (this.lastLine || '') + chunk.toString('utf8')
        const lines = text.split('\n')
        this.lastLine = lines.pop()

        for (const line of lines) {
          this.count++
          if (!(this.count % 10000)) console.log(this.name, this.count)

          const entity = JSON.parse(line)
          this.push(entity)
        }

        return next(null)
      } catch (e) {
        return next(e as Error)
      }
    })()
  }
}

interface Saveable<Entity> {
  save(entities: Entity | Entity[]): Promise<void>
}

export class StreamStoreBufferSave<
  Entity,
  Store extends Saveable<Entity> = Saveable<Entity>,
> extends Writable {
  protected buffer: Entity[] = []

  constructor(protected store: Store, protected bufferLength = 10000) {
    super({ objectMode: true })
  }

  _write(
    entity: Entity,
    encoding: BufferEncoding,
    next: (error?: Error | null) => void,
  ): void {
    ;(async () => {
      try {
        this.buffer.push(entity)

        if (!(this.buffer.length % this.bufferLength)) {
          await this._save()
        }

        return next(null)
      } catch (e) {
        return next(e as Error)
      }
    })()
  }

  _final(next: (error?: Error | null) => void): void {
    ;(async () => {
      try {
        if (this.buffer.length) {
          await this._save()
        }

        return next(null)
      } catch (e) {
        return next(e as Error)
      }
    })()
  }

  protected async _save(): Promise<void> {
    const entities = this.buffer
    this.buffer = []
    return this.store.save(entities)
  }
}

export const StoreBackupRestore = StreamStoreBufferSave
