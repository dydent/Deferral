import {
  CoinGeckoCurrencies,
  CoinGeckoCurrencyTypes,
  CoinGeckoIds,
} from "../../types/CoinGeckoTypes";

import { CoinGeckoClient } from "coingecko-api-v3";
import {
  ChainFiatPriceType,
  EvaluationChainDataType,
} from "../../types/EvaluationTypes";
import { BigNumber } from "ethers";
import { getKeyByValue } from "./get-key-by-value";

// -----------------------------------------------------------------------------------------------
// helper function to get fiat prices of chains by using CoinGecko API
// -----------------------------------------------------------------------------------------------

// get CoinGecko API client
const coinGeckoClient = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true,
});

// function takes a chainData object and an optional currency as input --> gets the current fiat prices for the chains specified in the chainData object
export const getFiatChainPrices = async (
  chainData: EvaluationChainDataType,
  // fiat currency
  currency: CoinGeckoCurrencyTypes = CoinGeckoCurrencies.USD
): Promise<{
  fiatPrices: ChainFiatPriceType<number>;
}> => {
  // initialize an empty object to store the fetched fiat prices
  const resultFiatPrices = {} as ChainFiatPriceType<number>;
  const chainIds: CoinGeckoIds[] = [];

  // get all chain ids from the chainData object
  Object.entries(chainData).map(([, value]) => {
    chainIds.push(value.coinGeckoId);
  });

  try {
    console.log(`... fetching ${currency} prices for different chains  ...\n`);
    // fetch the current prices for the specified chain ids and currency using the CoinGecko API
    // results of simple price represent price for one ether/base unit e.g. 1 ether, 1 matic, etc...
    const data = await coinGeckoClient.simplePrice({
      ids: chainIds.join(","),
      vs_currencies: currency,
    });

    // update the resultFiatPrices object with the fetched data
    Object.entries(data).map(([key, value]) => {
      const resultKey: keyof ChainFiatPriceType<BigNumber> = getKeyByValue(
        CoinGeckoIds,
        key
      ) as keyof ChainFiatPriceType<BigNumber>;
      // add the fetched price to the resultFiatPrices object
      resultFiatPrices[resultKey] = value[currency];
    });
  } catch (e) {
    console.log(`could not get current fiat prices for evaluation chains !`, e);
  }

  // return the fetched fiat prices
  return {
    fiatPrices: resultFiatPrices,
  };
};
