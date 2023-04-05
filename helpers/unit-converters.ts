import { BigNumber, BigNumberish, utils } from "ethers";
import { toBn } from "evm-bn";
import { EtherUnits } from "../types/ValidUnitTypes";

// -----------------------------------------------------------------------------------------------
// helper functions for converting numbers to wei and ether units
// -----------------------------------------------------------------------------------------------

const ETHER_TO_GWEI_FACTOR: BigNumber = BigNumber.from(1000000000);

export const ethToWeiConverter = (weiInputValue: BigNumberish): string => {
  return utils.formatEther(weiInputValue);
};

export const weiToEthConverter = (weiInputValue: BigNumber): BigNumber => {
  return toBn(utils.formatUnits(weiInputValue, 18));
};

export const ethConverter = (
  ethInputValue: BigNumberish | number
): BigNumber => {
  return utils.parseUnits(ethInputValue.toString(), "ether");
};

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
