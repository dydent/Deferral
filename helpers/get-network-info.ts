import { Signer } from "ethers";

export const getNetworkInfo = async (
  deployer: Signer
): Promise<number | undefined> => {
  // get current network
  const currentNetwork = await deployer.provider?.getNetwork();
  return currentNetwork?.chainId;
};
