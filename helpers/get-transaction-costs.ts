import { BigNumber, ContractTransaction } from "ethers";

export const getTransactionCosts = async (
  tx: ContractTransaction
): Promise<BigNumber> => {
  // calculate referral transaction costs
  // calculate referral transaction costs
  const txReceipt = await tx.wait();
  // gas used by the transaction
  const txGasUsed = await txReceipt.gasUsed;
  // gas price
  const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
  // return tx costs
  return txGasUsed.mul(txEffectiveGasPrice);
};
