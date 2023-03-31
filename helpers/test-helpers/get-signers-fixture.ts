import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

type SignersFixtureReturnType = {
  [signerName: string]: SignerWithAddress;
};

export async function getSignersFixture(): Promise<SignersFixtureReturnType> {
  const [admin, receiver, updatedReceiver, referrer, referee] =
    await ethers.getSigners();

  return {
    admin,
    receiver,
    updatedReceiver,
    referrer,
    referee,
  };
}
