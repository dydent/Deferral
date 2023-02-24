import { Signer } from "ethers";

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
