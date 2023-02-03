import { ethers } from "hardhat";
import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";

import { DeferralToken, DeferralToken__factory } from "../typechain";
import { Signer } from "ethers";

use(chaiAsPromised);

describe("DeferralToken", () => {
  let deferralTokenFactory: DeferralToken__factory;
  let deferralToken: DeferralToken;

  describe("Deployment", () => {
    console.log("hello");
    let deployer: Signer;

    beforeEach(async () => {
      [deployer] = await ethers.getSigners();
      deferralTokenFactory = new DeferralToken__factory(deployer);
      deferralToken = await deferralTokenFactory.deploy(100);
      await deferralToken.deployed();
    });

    it("should have the correct name", async () => {
      [deployer] = await ethers.getSigners();
      console.log("deployer", deployer, "");
      deferralTokenFactory = new DeferralToken__factory(deployer);
      deferralToken = await deferralTokenFactory.deploy(100);
      await deferralToken.deployed();
      expect(await deferralToken.name()).to.equal("Deferral");
    });

    it("should have the correct symbol", async () => {
      expect(await deferralToken.symbol()).to.equal("DEF");
    });

    it("should have the correct total supply", async () => {
      expect((await deferralToken.totalSupply()).toString()).to.equal("100");
    });

    it("should have correct balance after deployment", async () => {
      expect(
        await deferralToken.balanceOf(await deployer.getAddress())
      ).to.equal("100");
    });
  });
});
