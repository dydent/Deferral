import { Signer } from "ethers";
import { ethers } from "hardhat";

// helper functions to generate n wallets
export const generateRandomSigners = (amount: number): Signer[] => {
  const signers: Signer[] = [];
  for (let i = 0; i < amount; i++) {
    signers.push(ethers.Wallet.createRandom());
  }
  return signers;
};
