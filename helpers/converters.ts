import { BigNumber, BigNumberish, utils } from "ethers";

export const weiConverter = (weiInputValue: BigNumberish): string => {
  return utils.formatEther(weiInputValue);
};

export const ethConverter = (
  ethInputValue: BigNumberish | number
): BigNumber => {
  return utils.parseUnits(ethInputValue.toString(), "ether");
};
