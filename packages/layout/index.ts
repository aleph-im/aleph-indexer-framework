// @ts-nocheck

import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  Blob,
  greedy,
  Layout,
  seq,
  struct,
  u32,
  u8,
  Structure,
} from 'buffer-layout'
import * as borsh from '@project-serum/borsh'

export {
  struct,
  u8,
  u16,
  u32,
  s8 as i8,
  s16 as i16,
  s32 as i32,
  nu64,
  ns64,
  blob,
  seq,
  offset,
  bits,
  UInt,
  Layout,
  Structure,
  cstr,
} from 'buffer-layout'

export class Zeros extends Blob {
  decode(b, offset) {
    const slice = super.decode(b, offset)
    if (!slice.every((v) => v === 0)) {
      throw new Error('nonzero padding bytes')
    }
    return slice
  }
}

export class PublicKeyLayout extends Blob {
  constructor(property: string) {
    super(32, property)
  }

  decode(b, offset) {
    return new PublicKey(super.decode(b, offset))
  }

  encode(src, b, offset) {
    return super.encode(src.toBuffer(), b, offset)
  }
}

export class BNLayout extends Blob {
  decode(b, offset) {
    return new BN(super.decode(b, offset), 10, 'le')
  }

  encode(src, b, offset) {
    return super.encode(src.toArrayLike(Buffer, 'le', this.span), b, offset)
  }
}

export class BorshDecimal extends Structure {
  private precision = 100000 // 1.00000

  constructor(property: string) {
    super([i128('mantissa'), u32('scale')], property)
  }

  decodeNumber(b, offset): number {
    const obj = super.decode(b, offset)
    return (
      obj.mantissa.muln(this.precision).divn(obj.scale).toNumber() /
      this.precision
    )
  }
}

export class AnchorAccountStructure extends Structure {
  decode(b: Buffer, offset?: number): any {
    return super.decode(b, 8)
  }
}

export function zeros(length: number): Zeros {
  return new Zeros(length)
}

export function publicKey(property: string): PublicKeyLayout {
  return new PublicKeyLayout(property)
}

export function borshDecimal(property: string): Layout {
  return new BorshDecimal(property)
}

export function anchorStruct(
  fields: Layout[],
  property?: string,
  decodePrefixes?,
): AnchorAccountStructure {
  return new AnchorAccountStructure(fields, property, decodePrefixes)
}

export function bytes(property: string): Layout {
  return seq(u8(), greedy(u8().span), property)
}

export function vec(elementLayout: Layout, property: string): Layout {
  return borsh.vec(elementLayout, property)
}

export function string(property?: string): Layout {
  return borsh.str(property)
}

export function bool(property: string): Layout {
  return u8(property)
}

export function option(layout: Layout, property?: string): Layout {
  return borsh.option(layout, property)
}

export function u64(property: string): Layout {
  return new BNLayout(8, property)
}

export function u128(property: string): Layout {
  return new BNLayout(16, property)
}

export function i64(property: string): Layout {
  return new BNLayout(8, property)
}

export function i128(property: string): Layout {
  return new BNLayout(16, property)
}

export function setLayoutDecoder(layout, decoder): void {
  const originalDecode = layout.decode
  layout.decode = function decode(b, offset = 0) {
    return decoder(originalDecode.call(this, b, offset))
  }
}

export function setLayoutEncoder(layout, encoder): void {
  const originalEncode = layout.encode
  layout.encode = function encode(src, b, offset) {
    return originalEncode.call(this, encoder(src), b, offset)
  }
  return layout
}

export const rustString = (property = 'string'): unknown => {
  const rsl = struct(
    [u32('length'), u32('lengthPadding'), blob(offset(u32(), -8), 'chars')],
    property,
  )
  const _decode = rsl.decode.bind(rsl)
  const _encode = rsl.encode.bind(rsl)

  rsl.decode = (buffer: Buffer, offset: number) => {
    const data: any = _decode(buffer, offset)
    return data.chars.toString('utf8')
  }

  rsl.encode = (str: string, buffer: Buffer, offset: number) => {
    const data = {
      chars: Buffer.from(str, 'utf8'),
    }
    return _encode(data, buffer, offset)
  }

  return rsl
}

export const MAX_UINT64_HEX = 'ffffffffffffffff'

export function isMaxU64(num: BN): boolean {
  return num.toString('hex') === MAX_UINT64_HEX
}
