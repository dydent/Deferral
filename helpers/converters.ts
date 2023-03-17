import { BigNumber, BigNumberish, utils } from "ethers";

// -----------------------------------------------------------------------------------------------
// helper functions for converting numbers to wei and ether units
// -----------------------------------------------------------------------------------------------

export const ethToWeiConverter = (weiInputValue: BigNumberish): string => {
  return utils.formatEther(weiInputValue);
};

export const ethConverter = (
  ethInputValue: BigNumberish | number
): BigNumber => {
  return utils.parseUnits(ethInputValue.toString(), "ether");
};
