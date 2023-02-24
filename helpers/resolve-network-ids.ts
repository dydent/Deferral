const HARDHAT_NETWORK_ID = 31337;
const GANACHE_NETWORK_ID = 1337;

export const resolveNetworkIds = (
  name: string | undefined,
  id: number | undefined
): string | undefined => {
  if (id === GANACHE_NETWORK_ID) return "Ganache-Local";
  if (id === HARDHAT_NETWORK_ID) return "Hardhat-Local";
  return name;
};
