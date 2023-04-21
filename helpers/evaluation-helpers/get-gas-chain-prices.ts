import { BigNumber, providers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import {
  ChainGasPricesType,
  EvaluationChainDataType,
} from "../../types/EvaluationTypes";
import { weiToEthConverter, weiToGweiConverter } from "../unit-converters";
import { ChainType } from "../../types/ChainTypes";

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set the INFURA_API_KEY in a .env file");
}

export async function getGasChainPrices(
  chainData: EvaluationChainDataType
): Promise<{
  bnGasPricesInWei: ChainGasPricesType<BigNumber>;
  gasPricesInWei: ChainGasPricesType<string>;
  gasPricesInGwei: ChainGasPricesType<string>;
  gasPricesInEth: ChainGasPricesType<string>;
}> {
  let bnResultGasPricesInWei = {} as ChainGasPricesType<BigNumber>;
  let resultGasPricesInWei = {} as ChainGasPricesType<string>;
  let resultGasPricesInGwei = {} as ChainGasPricesType<string>;
  let resultGasPricesInEther = {} as ChainGasPricesType<string>;
  let jsonRpcUrl: string;

  for (const chainString of Object.keys(chainData)) {
    // reconvert type
    const chain = chainString as ChainType;
    switch (chain) {
      case "avalanche":
        jsonRpcUrl = "https://api.avax.network/ext/bc/C/rpc";
        break;
      case "bsc":
        jsonRpcUrl = "https://bsc-dataseed.binance.org/";
        break;
      case "polygon-mainnet":
        jsonRpcUrl = "https://polygon-rpc.com/";
        break;
      case "arbitrum-mainnet":
        jsonRpcUrl = "https://arb1.arbitrum.io/rpc";
        break;
      case "optimism-mainnet":
        jsonRpcUrl = "https://mainnet.optimism.io";
        break;
      default:
        jsonRpcUrl = "https://" + chain + ".infura.io/v3/" + infuraApiKey;
    }
    try {
      console.log(`... getting current gas price for ${chain} chain ...`);
      const provider: JsonRpcProvider = new providers.JsonRpcProvider(
        jsonRpcUrl
      );
      const bnGasPriceInWei: BigNumber = await provider.getGasPrice();
      const gasPriceInWei = bnGasPriceInWei.toString();
      const gasPriceInGwei: string = weiToGweiConverter(bnGasPriceInWei);
      const gasPriceInEther: string = weiToEthConverter(bnGasPriceInWei);

      console.log(
        `... ${chain} current gas prices: \n \t --> wei:${gasPriceInWei}/${bnGasPriceInWei} \n \t --> gwei:${gasPriceInGwei} \n \t --> ether/default unit:${gasPriceInEther}\n`
      );

      // add values to result objects
      bnResultGasPricesInWei[chain] = bnGasPriceInWei;
      resultGasPricesInWei[chain] = gasPriceInWei;
      resultGasPricesInGwei[chain] = gasPriceInGwei;
      resultGasPricesInEther[chain] = gasPriceInEther;
    } catch (e) {
      console.log(`could not get current gas price for ${chain}chain !`, e);
    }
  }
  return {
    bnGasPricesInWei: bnResultGasPricesInWei,
    gasPricesInWei: resultGasPricesInWei,
    gasPricesInGwei: resultGasPricesInGwei,
    gasPricesInEth: resultGasPricesInEther,
  };
}
