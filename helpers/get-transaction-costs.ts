import { BigNumber, ContractTransaction } from "ethers";

export const getTransactionCosts = async (
  tx: ContractTransaction
): Promise<BigNumber> => {
  // calculate referral transaction costs
  const txReceipt = await tx.wait();
  const txGasUsed = await txReceipt.gasUsed;
  const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
  return txGasUsed.mul(txEffectiveGasPrice);
};
