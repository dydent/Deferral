import {
  CoinGeckoCurrencies,
  CoinGeckoCurrencyTypes,
  CoinGeckoIds,
} from "../../types/ChainTypes";

import { CoinGeckoClient } from "coingecko-api-v3";
import {
  ChainFiatPriceType,
  EvaluationChainDataType,
} from "../../types/EvaluationTypes";
import { BigNumber } from "ethers";

const coinGeckoClient = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true,
});

// Returns the key corresponding to the given value in the provided enum object.
function getKeyByValue(
  enumObj: Record<string, string>,
  value: string
): string | undefined {
  // Iterate over enum keys, find and return the key with the matching value
  return Object.keys(enumObj).find((key) => enumObj[key] === value);
}

export const getFiatChainPrices = async (
  chainData: EvaluationChainDataType,
  // fiat currency
  currency: CoinGeckoCurrencyTypes = CoinGeckoCurrencies.USD
): Promise<{
  fiatPrices: ChainFiatPriceType<number>;
}> => {
  let resultFiatPrices = {} as ChainFiatPriceType<number>;
  let chainIds: CoinGeckoIds[] = [];
  // get all chain ids
  Object.entries(chainData).map(([, value]) => {
    chainIds.push(value.coinGeckoId);
  });
  try {
    console.log(`... fetching ${currency} prices for different chains  ...\n`);
    const data = await coinGeckoClient.simplePrice({
      ids: chainIds.join(","),
      vs_currencies: currency,
    });

    // update result value
    Object.entries(data).map(([key, value]) => {
      const resultKey: keyof ChainFiatPriceType<BigNumber> = getKeyByValue(
        CoinGeckoIds,
        key
      ) as keyof ChainFiatPriceType<BigNumber>;
      // add value to result
      resultFiatPrices[resultKey] = value[currency];
    });
  } catch (e) {
    console.log(`could not get current fiat prices for evaluation chains !`, e);
  }

  return {
    fiatPrices: resultFiatPrices,
  };
};

export async function fetchWeiToUSDConversionRates(
  chains: string[]
): Promise<Map<string, number> | null> {
  try {
    const data = await coinGeckoClient.simplePrice({
      ids: chains.join(","),
      vs_currencies: "usd",
    });

    const conversionRates = new Map<string, number>();

    for (const chain of chains) {
      const chainInWei = chain + "_wei";
      conversionRates.set(chainInWei, data[chain]?.usd || 0);
    }

    return conversionRates;
  } catch (error) {
    console.error("Error fetching conversion rates:", error);
    return null;
  }
}
