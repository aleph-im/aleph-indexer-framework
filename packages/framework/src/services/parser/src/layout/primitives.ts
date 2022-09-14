import { struct, u32, blob, offset } from '@aleph-indexer/layout'
import BN from 'bn.js'

export * from '@aleph-indexer/layout'

export const MAX_UINT64_HEX = 'ffffffffffffffff'

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

export function isMaxU64(num: BN) {
  return num.toString('hex') === MAX_UINT64_HEX
}

/**
 * Layout for a Rust String type
 */
// export const rustString = (property = 'string'): unknown => {
//   const rsl = struct(
//     [u32('length'), u32('lengthPadding'), blob(offset(u32(), -8), 'chars')],
//     property,
//   )
//   const _decode = rsl.decode.bind(rsl)
//   const _encode = rsl.encode.bind(rsl)

//   rsl.decode = (buffer: Buffer, offset: number) => {
//     const data = _decode(buffer, offset)
//     return data.chars.toString('utf8')
//   }

//   rsl.encode = (str: string, buffer: Buffer, offset: number) => {
//     const data = {
//       chars: Buffer.from(str, 'utf8'),
//     }
//     return _encode(data, buffer, offset)
//   }

//   return rsl
// }

// import BN from 'bn.js'
// import Big from 'big.js'

/**
 * Layout for a 64bit unsigned value
 */
// export const uint64 = (property = 'uint64'): unknown => {
//   const layout = blob(8, property)

//   const _decode = layout.decode.bind(layout)
//   const _encode = layout.encode.bind(layout)

//   layout.decode = (buffer: Buffer, offset: number) => {
//     const data = _decode(buffer, offset)
//     return new Big(
//       new BN(
//         [...data]
//           .reverse()
//           .map((i) => `00${i.toString(16)}`.slice(-2))
//           .join(''),
//         16,
//       ).toString(),
//     )
//   }

//   layout.encode = (num: Big, buffer: Buffer, offset: number) => {
//     const a = num.toArray().reverse()
//     let b = Buffer.from(a)
//     if (b.length !== 8) {
//       const zeroPad = Buffer.alloc(8)
//       b.copy(zeroPad)
//       b = zeroPad
//     }
//     return _encode(b, buffer, offset)
//   }

//   return layout
// }

// TODO: wrap in BN (what about decimals?)
// export const uint128 = (property = 'uint128'): unknown => {
//   const layout = blob(16, property)

//   const _decode = layout.decode.bind(layout)
//   const _encode = layout.encode.bind(layout)

//   layout.decode = (buffer: Buffer, offset: number) => {
//     const data = _decode(buffer, offset)
//     return new Big(
//       new BN(
//         [...data]
//           .reverse()
//           .map((i) => `00${i.toString(16)}`.slice(-2))
//           .join(''),
//         16,
//       ).toString(),
//     )
//   }

//   layout.encode = (num: Big, buffer: Buffer, offset: number) => {
//     const a = num.toArray().reverse()
//     let b = Buffer.from(a)
//     if (b.length !== 16) {
//       const zeroPad = Buffer.alloc(16)
//       b.copy(zeroPad)
//       b = zeroPad
//     }

//     return _encode(b, buffer, offset)
//   }

//   return layout
// }
