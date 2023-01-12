// Borrowed from coral-xyz/anchor
//
// https://github.com/coral-xyz/anchor/blob/master/ts/packages/anchor/src/coder/borsh/idl.ts

import camelCase from 'camelcase'
import { Layout } from '@aleph-indexer/layout'
import * as borsh from '@coral-xyz/borsh'
import { IdlError, Idl } from '@coral-xyz/anchor'
import {
  IdlInstruction,
  IdlEnumVariant,
  IdlField,
  IdlType,
  IdlTypeDef,
} from '@coral-xyz/anchor/dist/cjs/idl'
import { PythIdlInstruction } from '../types.js'
import bs58 from 'bs58'

export class IdlCoder {
  // Instruction args layout. Maps namespaced method
  public ixLayout: Map<string, Layout>

  // Base58 encoded sighash to instruction layout.
  public discriminatorLayouts: Map<string, { layout: Layout; name: string }>
  public ixDiscriminator: Map<string, Buffer>
  public discriminatorLength: number | undefined

  constructor(idl: Idl) {
    this.ixLayout = this.parseIxLayout(idl)

    const discriminatorLayouts = new Map()
    const ixDiscriminator = new Map()
    idl.instructions.forEach((ix: IdlInstruction) => {
      const pythIx = ix as PythIdlInstruction
      let discriminatorLength: number
      if (pythIx.discriminant) {
        discriminatorLayouts.set(
          bs58.encode(Buffer.from(pythIx.discriminant.value)),
          {
            layout: this.ixLayout.get(pythIx.name),
            name: pythIx.name,
          },
        )
        ixDiscriminator.set(pythIx.name, Buffer.from(pythIx.discriminant.value))
        discriminatorLength = pythIx.discriminant.value.length
      } else {
        throw new Error(`All instructions must have a discriminator`)
      }
      if (
        this.discriminatorLength &&
        this.discriminatorLength !== discriminatorLength
      ) {
        throw new Error(
          `All instructions must have the same discriminator length`,
        )
      } else {
        this.discriminatorLength = discriminatorLength
      }
    })

    this.discriminatorLayouts = discriminatorLayouts
    this.ixDiscriminator = ixDiscriminator
  }

  private parseIxLayout(idl: Idl): Map<string, Layout> {
    const ixLayouts = idl.instructions.map(
      (ix: IdlInstruction): [string, Layout<unknown>] => {
        const fieldLayouts = ix.args.map((arg: IdlField) =>
          this.fieldLayout(
            arg,
            Array.from([...(idl.accounts ?? []), ...(idl.types ?? [])]),
          ),
        )
        const name = camelCase(ix.name)
        return [name, borsh.struct(fieldLayouts, name)]
      },
    )

    return new Map(ixLayouts)
  }

  public fieldLayout(
    field: { name?: string } & Pick<IdlField, 'type'>,
    types?: IdlTypeDef[],
  ): Layout {
    const fieldName =
      field.name !== undefined ? camelCase(field.name) : undefined
    switch (field.type) {
      case 'bool': {
        return borsh.bool(fieldName)
      }
      case 'u8': {
        return borsh.u8(fieldName)
      }
      case 'i8': {
        return borsh.i8(fieldName)
      }
      case 'u16': {
        return borsh.u16(fieldName)
      }
      case 'i16': {
        return borsh.i16(fieldName)
      }
      case 'u32': {
        return borsh.u32(fieldName)
      }
      case 'i32': {
        return borsh.i32(fieldName)
      }
      case 'f32': {
        return borsh.f32(fieldName)
      }
      case 'u64': {
        return borsh.u64(fieldName)
      }
      case 'i64': {
        return borsh.i64(fieldName)
      }
      case 'f64': {
        return borsh.f64(fieldName)
      }
      case 'u128': {
        return borsh.u128(fieldName)
      }
      case 'i128': {
        return borsh.i128(fieldName)
      }
      case 'u256': {
        return borsh.u256(fieldName)
      }
      case 'i256': {
        return borsh.i256(fieldName)
      }
      case 'bytes': {
        return borsh.vecU8(fieldName)
      }
      case 'string': {
        return borsh.str(fieldName)
      }
      case 'publicKey': {
        return borsh.publicKey(fieldName)
      }
      default: {
        if ('vec' in field.type) {
          return borsh.vec(
            this.fieldLayout(
              {
                name: undefined,
                type: field.type.vec,
              },
              types,
            ),
            fieldName,
          )
        } else if ('option' in field.type) {
          return borsh.option(
            this.fieldLayout(
              {
                name: undefined,
                type: field.type.option,
              },
              types,
            ),
            fieldName,
          )
        } else if ('defined' in field.type) {
          const defined = field.type.defined
          // User defined type.
          if (types === undefined) {
            throw new IdlError('User defined types not provided')
          }
          const filtered = types.filter((t) => t.name === defined)
          if (filtered.length !== 1) {
            throw new IdlError(`Type not found: ${JSON.stringify(field)}`)
          }
          return this.typeDefLayout(filtered[0], types, fieldName)
        } else if ('array' in field.type) {
          const arrayTy = field.type.array[0]
          const arrayLen = field.type.array[1]
          const innerLayout = this.fieldLayout(
            {
              name: undefined,
              type: arrayTy,
            },
            types,
          )
          return borsh.array(innerLayout, arrayLen, fieldName)
        } else {
          throw new Error(`Not yet implemented: ${field}`)
        }
      }
    }
  }

  public typeDefLayout(
    typeDef: IdlTypeDef,
    types: IdlTypeDef[] = [],
    name?: string,
  ): Layout {
    if (typeDef.type.kind === 'struct') {
      const fieldLayouts = typeDef.type.fields.map((field: IdlField) => {
        const x = this.fieldLayout(field, types)
        return x
      })
      return borsh.struct(fieldLayouts, name)
    } else if (typeDef.type.kind === 'enum') {
      const variants = typeDef.type.variants.map((variant: IdlEnumVariant) => {
        const variantName = camelCase(variant.name)
        if (variant.fields === undefined) {
          return borsh.struct([], variantName)
        }
        const fieldLayouts = variant.fields.map(
          (f: IdlField | IdlType, i: number) => {
            // eslint-disable-next-line no-prototype-builtins
            if (!f.hasOwnProperty('name')) {
              return this.fieldLayout(
                { type: f as IdlType, name: i.toString() },
                types,
              )
            }
            // this typescript conversion is ok
            // because if f were of type IdlType
            // (that does not have a name property)
            // the check before would've errored
            return this.fieldLayout(f as IdlField, types)
          },
        )
        return borsh.struct(fieldLayouts, variantName)
      })

      if (name !== undefined) {
        // Buffer-layout lib requires the name to be null (on construction)
        // when used as a field.
        return borsh.rustEnum(variants).replicate(name)
      }

      return borsh.rustEnum(variants, name)
    } else {
      throw new Error(`Unknown type kint: ${typeDef}`)
    }
  }
}
