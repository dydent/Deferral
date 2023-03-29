import { BigNumber, BigNumberish, utils } from "ethers";
import { toBn } from "evm-bn";
import { EtherUnits } from "../types/ValidUnitTypes";

// -----------------------------------------------------------------------------------------------
// helper functions for converting numbers to wei and ether units
// -----------------------------------------------------------------------------------------------

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
  [EtherUnits.Wei]: (value: BigNumber): BigNumber =>
    toBn(utils.formatUnits(value, 0)),
  [EtherUnits.Gwei]: (value: BigNumber): BigNumber =>
    toBn(utils.formatUnits(value, 9)),
  [EtherUnits.Ether]: (value: BigNumber): BigNumber =>
    toBn(utils.formatUnits(value, 18)),
};
