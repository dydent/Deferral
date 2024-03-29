import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CoinGeckoCurrencyTypes } from "../../types/CoinGeckoTypes";
import { TransactionEvaluationType } from "../../types/EvaluationTypes";

// -----------------------------------------------------------------------------------------------
// helper function for logging data in the console during the evaluation runs
// -----------------------------------------------------------------------------------------------

type LogParams = TransactionEvaluationType & {
  user?: SignerWithAddress;
  referralCompleted?: boolean;
  fiatCurrency: CoinGeckoCurrencyTypes;
};

export function logEvaluationTx(params: LogParams): void {
  // Log values
  console.log(
    "\n-----------------------------------------------------------------------------------------------"
  );
  if (params.userIteration !== undefined)
    console.log(" User Iteration:", params.userIteration, "");
  if (params.user?.address !== undefined)
    console.log(" User Address:", params.user?.address, "");
  if (params.userTxIteration !== undefined)
    console.log(" User Tx Iteration:", params.userTxIteration, "");
  if (params.referralCompleted !== undefined)
    console.log(" Referral Process Completed:", params.referralCompleted, "");
  console.log("");
  if (params.durationInMs !== undefined)
    console.log(` TX Duration in Ms: ${params.durationInMs}`);
  if (params.gasUsed !== undefined) console.log(` Gas Used: ${params.gasUsed}`);
  console.log("");
  // log gas costs values
  if (params.bscGasCost !== undefined)
    console.log(` BSC TX GasCost (in wei): ${params.bscGasCost}`);
  if (params.ethereumGasCost !== undefined)
    console.log(` ETH TX GasCost (in wei): ${params.ethereumGasCost}`);
  if (params.polygonMainnetGasCost !== undefined)
    console.log(
      ` Polygon Mainnet TX GasCost (in wei): ${params.polygonMainnetGasCost}`
    );
  if (params.arbitrumMainnetGasCost !== undefined)
    console.log(
      ` Arbitrum Mainnet TX GasCost (in wei): ${params.arbitrumMainnetGasCost}`
    );
  if (params.optimismMainnetGasCost !== undefined)
    console.log(
      ` Optimism Mainnet TX GasCost (in wei): ${params.optimismMainnetGasCost}`
    );
  if (params.avalancheGasCost !== undefined)
    console.log(
      ` Avalanche Mainnet TX GasCost (in wei): ${params.avalancheGasCost}`
    );
  if (params.goerliGasCost !== undefined)
    console.log(` Goerli Testnet TX GasCost (in wei): ${params.goerliGasCost}`);
  console.log("");
  // log fiat costs values
  if (params.bscFiatCost !== undefined)
    console.log(
      ` BSC TX FiatCost (in ${params.fiatCurrency}): ${params.bscFiatCost}`
    );
  if (params.ethereumFiatCost !== undefined)
    console.log(
      ` ETH TX FiatCost (in ${params.fiatCurrency}): ${params.ethereumFiatCost}`
    );
  if (params.polygonMainnetFiatCost !== undefined)
    console.log(
      ` Polygon Mainnet TX FiatCost (in ${params.fiatCurrency}): ${params.polygonMainnetFiatCost}`
    );
  if (params.arbitrumMainnetFiatCost !== undefined)
    console.log(
      ` Arbitrum Mainnet TX FiatCost (in ${params.fiatCurrency}): ${params.arbitrumMainnetFiatCost}`
    );
  if (params.optimismMainnetFiatCost !== undefined)
    console.log(
      ` Optimism Mainnet TX FiatCost (in ${params.fiatCurrency}): ${params.optimismMainnetFiatCost}`
    );
  if (params.avalancheFiatCost !== undefined)
    console.log(
      ` Avalanche Mainnet TX FiatCost (in ${params.fiatCurrency}): ${params.avalancheFiatCost}`
    );
  if (params.goerliFiatCost !== undefined)
    console.log(
      ` Goerli Testnet TX FiatCost (in ${params.fiatCurrency}): ${params.goerliFiatCost}`
    );
  console.log(
    "-----------------------------------------------------------------------------------------------\n"
  );
}
