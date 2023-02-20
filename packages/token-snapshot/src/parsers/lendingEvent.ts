import BN from 'bn.js'
import {
  SolanaParsedInstructionContext,
  getTokenBalance,
  getBurnedCollateralAmount,
  getMintedCollateralAmount,
  getSubInstructions,
  getTransferedAmount,
  isMaxU64,
} from '@aleph-indexer/solana'
import {
  LendingEvent,
  BorrowObligationLiquidityEvent,
  DepositObligationCollateralEvent,
  DepositReserveLiquidityEvent,
  LiquidateObligationEvent,
  RedeemReserveCollateralEvent,
  RepayObligationLiquidityEvent,
  LendingEventType,
  WithdrawObligationCollateralEvent,
  DepositReserveLiquidityAndObligationCollateralEventInfo,
  RedeemReserveCollateralEventInfo,
  DepositObligationCollateralEventInfo,
  WithdrawObligationCollateralEventInfo,
  BorrowObligationLiquidityEventInfo,
  RepayObligationLiquidityEventInfo,
  LiquidateObligationEventInfo,
  WithdrawObligationCollateralAndRedeemReserveCollateralEventInfo,
  WithdrawObligationCollateralAndRedeemReserveCollateralEvent,
  FlashLoanEventInfo,
  FlashLoanEvent,
  LendingRawEvent,
} from '../types.js'

export class LendingEventParser {
  parse(ixCtx: SolanaParsedInstructionContext): LendingEvent {
    const { instruction, parentInstruction, parentTransaction } = ixCtx

    const parsed = (instruction as LendingRawEvent).parsed

    const id = `${parentTransaction.signature}${
      parentInstruction ? `:${parentInstruction.index.toString().padStart(2, '0')}` : ''
    }:${instruction.index.toString().padStart(2, '0')}`

    const timestamp = parentTransaction.blockTime
      ? parentTransaction.blockTime * 1000
      : parentTransaction.slot

    const baseEvent = {
      ...parsed.info,
      id,
      timestamp,
      mint: ixCtx.txContext.parserContext.account,
      type: parsed.type,
    }

    try {
      switch (parsed.type) {
        case LendingEventType.DepositReserveLiquidity:
        case LendingEventType.DepositReserveLiquidityAndObligationCollateral: {
          const subIxs = getSubInstructions(ixCtx)
          const info =
            parsed.info as DepositReserveLiquidityAndObligationCollateralEventInfo
          const collateralAmount = getMintedCollateralAmount(
            info.userCollateral,
            info.reserveCollateralMint,
            subIxs,
          )
          let liquidityAmount = info.liquidityAmount
          if (isMaxU64(liquidityAmount)) {
            liquidityAmount = getTransferedAmount(
              info.userLiquidity,
              info.reserveLiquidityVault,
              subIxs,
            )
          }
          const reserveLiquidityAmount = new BN(
            getTokenBalance(parentTransaction, info.reserveLiquidityVault, true) || 0,
          )
          return {
            account: info.userLiquidity,
            owner: info.transferAuthority,
            ...baseEvent,
            liquidityAmount,
            collateralAmount,
            reserveLiquidityAmount,
          } as DepositReserveLiquidityEvent
        }

        case LendingEventType.RedeemReserveCollateral: {
          const subIxs = getSubInstructions(ixCtx)
          const info = parsed.info as RedeemReserveCollateralEventInfo
          const liquidityAmount = getTransferedAmount(
            info.reserveLiquidityVault,
            info.userLiquidity,
            subIxs,
          )
          let collateralAmount = info.collateralAmount
          if (isMaxU64(collateralAmount)) {
            collateralAmount = getBurnedCollateralAmount(
              info.userLiquidity,
              info.reserveLiquidityVault,
              subIxs,
            )
          }
          const reserveLiquidityAmount = new BN(
            getTokenBalance(parentTransaction, info.reserveLiquidityVault, true) || 0,
          )
          return {
            account: info.userLiquidity,
            owner: info.transferAuthority,
            ...baseEvent,
            liquidityAmount,
            collateralAmount,
            reserveLiquidityAmount,
          } as RedeemReserveCollateralEvent
        }

        case LendingEventType.DepositObligationCollateral: {
          const info = parsed.info as DepositObligationCollateralEventInfo
          let collateralAmount = info.collateralAmount
          if (isMaxU64(collateralAmount)) {
            const subIxs = getSubInstructions(ixCtx)
            collateralAmount = getTransferedAmount(
              info.userCollateral,
              info.reserveCollateralVault,
              subIxs,
            )
          }
          return {
            owner: info.transferAuthority,
            ...baseEvent,
            collateralAmount,
          } as DepositObligationCollateralEvent
        }

        case LendingEventType.WithdrawObligationCollateralAndRedeemReserveCollateral:
        case LendingEventType.WithdrawObligationCollateral: {
          const info = parsed.info as WithdrawObligationCollateralEventInfo
          let collateralAmount = info.collateralAmount
          if (isMaxU64(collateralAmount)) {
            const subIxs = getSubInstructions(ixCtx)
            collateralAmount = getTransferedAmount(
              info.reserveCollateralVault,
              info.userCollateral,
              subIxs,
            )
          }
          if (parsed.type === LendingEventType.WithdrawObligationCollateral) {
            return {
              owner: info.obligationOwner,
              ...baseEvent,
              collateralAmount,
            } as WithdrawObligationCollateralEvent
          } else {
            const subIxs = getSubInstructions(ixCtx)
            const info =
              parsed.info as WithdrawObligationCollateralAndRedeemReserveCollateralEventInfo
            const liquidityAmount = getTransferedAmount(
              info.reserveLiquidityVault,
              info.userLiquidity,
              subIxs,
            )
            const reserveLiquidityAmount = new BN(
              getTokenBalance(parentTransaction, info.reserveLiquidityVault, true) || 0,
            )
            return {
              account: info.userLiquidity,
              owner: info.transferAuthority,
              ...baseEvent,
              collateralAmount,
              liquidityAmount,
              reserveLiquidityAmount,
            } as unknown as WithdrawObligationCollateralAndRedeemReserveCollateralEvent
          }
        }

        case LendingEventType.BorrowObligationLiquidity: {
          const subIxs = getSubInstructions(ixCtx)
          const info = parsed.info as BorrowObligationLiquidityEventInfo
          const liquidityFeeAmount = getTransferedAmount(
            info.reserveLiquidityVault,
            info.liquidityFeeReceiver,
            subIxs,
          )
          let liquidityAmount = info.liquidityAmount
          if (isMaxU64(liquidityAmount)) {
            liquidityAmount = getTransferedAmount(
              info.reserveLiquidityVault,
              info.userLiquidity,
              subIxs,
            )
          }
          const reserveLiquidityAmount = new BN(
            getTokenBalance(parentTransaction, info.reserveLiquidityVault, true) || 0,
          )
          return {
            account: info.userLiquidity,
            owner: info.obligationOwner,
            ...baseEvent,
            liquidityFeeAmount,
            liquidityAmount,
            reserveLiquidityAmount,
          } as BorrowObligationLiquidityEvent
        }

        case LendingEventType.RepayObligationLiquidity: {
          const info = parsed.info as RepayObligationLiquidityEventInfo
          let liquidityAmount = info.liquidityAmount
          if (isMaxU64(liquidityAmount)) {
            const subIxs = getSubInstructions(ixCtx)
            liquidityAmount = getTransferedAmount(
              info.userLiquidity,
              info.reserveLiquidityVault,
              subIxs,
            )
          }
          const reserveLiquidityAmount = new BN(
            getTokenBalance(parentTransaction, info.reserveLiquidityVault, true) || 0,
          )
          return {
            account: info.userLiquidity,
            owner: info.transferAuthority,
            ...baseEvent,
            liquidityAmount,
            reserveLiquidityAmount,
          } as RepayObligationLiquidityEvent
        }

        case LendingEventType.LiquidateObligation:
        case LendingEventType.LiquidateObligation2: {
          const subIxs = getSubInstructions(ixCtx)
          const info = parsed.info as LiquidateObligationEventInfo
          const liquidityRepayAmount = getTransferedAmount(
            info.userLiquidity,
            info.repayReserveLiquidityVault,
            subIxs,
          )
          const collateralWithdrawAmount = getTransferedAmount(
            info.withdrawReserveCollateralVault,
            info.userCollateral,
            subIxs,
          )
          const repayReserveLiquidityAmount = new BN(
            getTokenBalance(parentTransaction, info.repayReserveLiquidityVault, true) ||
              0,
          )
          return {
            account: info.userLiquidity,
            owner: info.transferAuthority,
            ...baseEvent,
            liquidityRepayAmount,
            collateralWithdrawAmount,
            repayReserveLiquidityAmount,
          } as LiquidateObligationEvent
        }

        case LendingEventType.FlashLoan: {
          const subIxs = getSubInstructions(ixCtx)
          const info = parsed.info as FlashLoanEventInfo
          const liquidityFeeAmount = getTransferedAmount(
            info.reserveLiquidityVault,
            info.liquidityFeeReceiver,
            subIxs,
          )
          let liquidityAmount = info.liquidityAmount
          if (isMaxU64(liquidityAmount)) {
            liquidityAmount = getTransferedAmount(
              info.reserveLiquidityVault,
              info.userLiquidity,
              subIxs,
            )
          }
          return {
            ...baseEvent,
            liquidityFeeAmount,
            liquidityAmount,
          } as FlashLoanEvent
        }
        case LendingEventType.InitReserve:
        default: {
          console.log('default -> ', parsed.type, id)
          return baseEvent as LendingEvent
        }
      }
    } catch (e) {
      console.log('error -> ', parsed.type, id, e)
      throw e
    }
  }
}

export const lendingEventParser = new LendingEventParser()
export default lendingEventParser
