import { Signer } from "ethers";

// -----------------------------------------------------------------------------------------------
// helper functions to get info about the current network
// -----------------------------------------------------------------------------------------------

export const getNetworkInfo = async (
  deployer: Signer
): Promise<{
  name: string | undefined;
  id: number | undefined;
}> => {
  // get current network
  const currentNetwork = await deployer.provider?.getNetwork();
  return { name: currentNetwork?.name, id: currentNetwork?.chainId };
};
