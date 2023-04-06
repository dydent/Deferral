import { Signer } from "ethers";
import { ethers } from "hardhat";
import { Provider } from "@ethersproject/providers";

// helper functions to generate n wallets
export const generateRandomSigners = (
  amount: number,
  provider: Provider
): Signer[] => {
  const signers: Signer[] = [];
  for (let i = 0; i < amount; i++) {
    const wallet = ethers.Wallet.createRandom();
    const connectedWallet = wallet.connect(provider);
    signers.push(connectedWallet);
  }
  return signers;
};
