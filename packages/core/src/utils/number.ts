import BN from 'bn.js'
import { usdDecimals } from '../constants.js'

export function bnDiv(num: BN, den: BN): number {
  const { div, mod: rem } = (num as any).divmod(den)
  const quotient = div.toNumber()
  const gcd = rem.gcd(den)
  return quotient + rem.div(gcd).toNumber() / den.div(gcd).toNumber()
}

export function bnDivSafe(num: BN, den: number | BN): number {
  const denBN = den instanceof BN ? den : new BN(den)

  if (num.isZero()) return 0

  try {
    return bnDiv(num, denBN)
  } catch {
    console.log('⭕️⭕️⭕️ BN error', num, denBN)
    const mcpow = Math.min(num.toString().length, den.toString().length)
    const reducedNumerator = num.divn(mcpow)
    const reducedDenominator = denBN.divn(mcpow)

    return bnDiv(reducedNumerator, reducedDenominator) * mcpow
  }
}

export function bnMulPrice(
  num: BN,
  price: number,
  sourceDecimals: number,
  targetDecimals: number = usdDecimals,
): BN {
  if (num.isZero() || price === 0) return new BN(0)

  const priceExp = targetDecimals - sourceDecimals
  const priceNumber = 10 ** priceExp * price

  // Int price
  const priceIntBN = new BN(Math.trunc(priceNumber))
  const res = num.mul(priceIntBN)

  // Float price
  const [, dec] = String(priceNumber.toFixed(20)).split('.')
  if (!dec) return res

  const priceFloat = Number(`0.${dec}`)
  // const maxExp = Math.max(sourceDecimals, targetDecimals, usdDecimals)
  // @note: BN lib limitation: assert(number < 0x20000000000000); "9007199254740992" (16-1)
  const exp = Math.min(dec.length, 15)
  const pow = 10 ** exp
  const powBN = new BN(10).pow(new BN(exp))

  const priceFloatBN = new BN(Math.round(priceFloat * pow))
  res.iadd(num.mul(priceFloatBN).div(powBN))

  // console.log(`
  //   num: ${num}
  //   price: ${price}
  //   sourceDecimals: ${sourceDecimals}
  //   targetDecimals: ${targetDecimals}

  //   priceIntBN: ${priceIntBN}
  //   priceFloatBN: ${priceFloatBN}
  //   res: ${res.toString()}
  // `)

  return res
}
