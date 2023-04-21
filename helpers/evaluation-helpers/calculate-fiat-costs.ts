import { BigNumber } from "ethers";

/**
 * Calculate the fiat price given the gas price in Wei and the fiat price for one default value.
 *
 * @param gasPriceInWei - The gas price in Wei as a BigNumber.
 * @param fiatPriceForOneEther - Fiat Currency price as number for one default unit --> e.g. 1 ether, 1 matic, 1 bnb.
 * @returns The gas price in USD as a number.
 */
export function calculateFiatCosts(
  gasPriceInWei: BigNumber,
  fiatPriceForOneEther: number
): number {
  // Convert the gas price from Wei to Gwei (1 Gwei = 1e9 Wei).
  // BigNumber is used for the division since gas prices in Wei can be very large.
  const gasPriceInGwei: BigNumber = gasPriceInWei.div(
    BigNumber.from("1000000000")
  );

  // Convert the gas price from Gwei to Ether (1 Ether = 1e9 Gwei).
  // Convert the result to a number for easier calculations in the next step.
  const gasPriceInEther: number = gasPriceInGwei.toNumber() / 1_000_000_000;

  // Calculate the gas price in fiat currency by multiplying the gas price by the fiat price.
  // Return the calculated gas price in the fiat currency.
  return gasPriceInEther * fiatPriceForOneEther;
}
