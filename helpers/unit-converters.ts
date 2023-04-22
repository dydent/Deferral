import { BigNumber, utils } from "ethers";
import { toBn } from "evm-bn";
import { EtherUnits } from "../types/ValidUnitTypes";

// -----------------------------------------------------------------------------------------------
// helper functions for converting units
// -----------------------------------------------------------------------------------------------

/**
 * Ether (EVM Based) units:
 *
 * 1. Wei: Smallest unit of ether.
 *    1 Ether = 1 x 10^18 Wei
 *
 * 2. Gwei: Larger unit of ether, often used in gas prices.
 *    1 Ether = 1 x 10^9 Gwei
 *    1 Gwei = 1 x 10^9 Wei
 *
 * 3. Ether: Base unit of the Ethereum same as e.g. MATIC on Polygon etc....
 */

// conversion factor constant used for calculations
const ETHER_TO_GWEI_FACTOR: BigNumber = BigNumber.from(1000000000);

export const weiToEthConverter = (weiInputValue: BigNumber): string => {
  return utils.formatEther(weiInputValue);
};

export function weiToGweiConverter(weiInputValue: BigNumber): string {
  return utils.formatUnits(weiInputValue, 9);
}

/**
 * takes a regular number or bignumber as input and converts it to the desired unit
 *
 * E.g. Input:1
 *  --> wei: 1
 *  --> gwei: 1000000000
 *  --> ether: 1000000000000000000
 */

export const etherUnitConverter = {
  [EtherUnits.Ether]: (value: BigNumber | number): BigNumber => {
    // if input is decimal number use toBn from evm-bn library
    if (typeof value === "number" && !Number.isInteger(value)) {
      return toBn(value.toString());
    } else {
      return toBn(utils.formatUnits(value, 0));
    }
  },
  [EtherUnits.Gwei]: (value: BigNumber | number): BigNumber => {
    if (typeof value === "number" && !Number.isInteger(value)) {
      const valueInEther = toBn(value.toString());
      return valueInEther.div(ETHER_TO_GWEI_FACTOR);
    } else {
      return toBn(utils.formatUnits(value, 9));
    }
  },
  [EtherUnits.Wei]: (value: BigNumber | number): BigNumber => {
    if (typeof value === "number" && !Number.isInteger(value)) {
      throw new Error(`cannot convert decimal value of ${value} to Wei`);
    } else {
      return toBn(utils.formatUnits(value, 18));
    }
  },
};
