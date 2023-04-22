import { BigNumber, ContractTransaction } from "ethers";

// -----------------------------------------------------------------------------------------------
// helper functions to calculate the tx cost of a transaction
// -----------------------------------------------------------------------------------------------

export const getTransactionCosts = async (
  tx: ContractTransaction
): Promise<BigNumber> => {
  // calculate referral transaction costs
  const txReceipt = await tx.wait();
  // gas used by the transaction
  const txGasUsed = await txReceipt.gasUsed;
  // gas price
  const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
  // return tx costs
  return txGasUsed.mul(txEffectiveGasPrice);
};
