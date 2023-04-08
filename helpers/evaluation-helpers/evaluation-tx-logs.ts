import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

type LogParams = {
  user?: SignerWithAddress;
  userIteration?: number;
  userTxIteration?: number;
  referralCompleted?: boolean;
  txGasUsed?: BigNumber;
  txEffectiveGasPrice?: BigNumber;
  txCost?: BigNumber;
  txDurationInMs?: number;
};

export function logEvaluationTx(params: LogParams): void {
  const {
    user,
    userIteration,
    userTxIteration,
    referralCompleted,
    txGasUsed,
    txEffectiveGasPrice,
    txCost,
    txDurationInMs,
  } = params;

  // Log values
  if (userIteration !== undefined)
    console.log(" User Iteration", userIteration, "");
  if (user?.address !== undefined)
    console.log(" User Address:", user?.address, "");
  if (userTxIteration !== undefined)
    console.log(" User Tx Iteration", userTxIteration, "");
  if (referralCompleted !== undefined)
    console.log(" Referral Process Completed", referralCompleted, "");
  if (txGasUsed !== undefined) console.log(` Gas Used: ${txGasUsed}`);
  if (txEffectiveGasPrice !== undefined)
    console.log(` Effective Gas Price: ${txEffectiveGasPrice}`);
  if (txCost !== undefined)
    console.log(` Tx Cost: ${txCost} (gas used * gas price)`);
  if (txDurationInMs !== undefined)
    console.log(` Duration in Ms: ${txDurationInMs}`);
  console.log("\n");
}
