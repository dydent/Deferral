import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";
import {
  UpgradableV1ReferralPaymentProxy,
  UpgradableV2ReferralPaymentProxy,
} from "../typechain-types";

type FixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  referrer: SignerWithAddress;
  referee: SignerWithAddress;
  proxyContract: UpgradableV1ReferralPaymentProxy;
  proxyContractAddress: string;
  adminAddress: string;
  initialImplementationContractAddress: string;
  proxyAdminContractAddress: string;
  upgradedProxyContract: UpgradableV2ReferralPaymentProxy;
  upgradedImplementationAddress: string;
};

const INITIAL_CONTRACT = "UpgradableV1ReferralPaymentProxy";
const CONTRACT = "UpgradableV2ReferralPaymentProxy";

describe("Testing upgradable referral payment proxy contracts", async () => {
  // referral values / conditions (in ether)
  const PAYMENT_AMOUNT = 10;
  const REFERRAL_REWARD = 1;
  const PRICE = PAYMENT_AMOUNT - REFERRAL_REWARD;

  // helper function to deploy the referral contract
  async function deployUpgradableFixture(): Promise<FixtureReturnType> {
    const [admin, receiver, referrer, referee] = await ethers.getSigners();

    const referralContract = await ethers.getContractFactory(INITIAL_CONTRACT);

    // deploy upgrade proxy contract (typed as the underlying implementation contract)
    const proxyContract: UpgradableV1ReferralPaymentProxy =
      (await upgrades.deployProxy(referralContract, [
        receiver.address,
        ethConverter(PAYMENT_AMOUNT),
        ethConverter(REFERRAL_REWARD),
      ])) as UpgradableV1ReferralPaymentProxy;

    // proxy contract address
    const proxyContractAddress: string = proxyContract.address;

    // admin of all the upgrades contracts (proxyContract / implementationContract / proxyAdminContract
    const adminAddress: string = await proxyContract.signer.getAddress();

    // current implementation contract address
    const initialImplementationContractAddress: string =
      await upgrades.erc1967.getImplementationAddress(proxyContract.address);

    // address of the proxy admin contract  (typed as the underlying implementation contract)
    const proxyAdminContractAddress: string =
      await upgrades.erc1967.getAdminAddress(proxyContract.address);

    // contract to upgrade initial contract
    const upgradedImplementationContract: ContractFactory =
      await ethers.getContractFactory(CONTRACT);
    // use proxy to upgrade contract
    const upgradedProxyContract: UpgradableV2ReferralPaymentProxy =
      (await upgrades.upgradeProxy(
        proxyContract,
        upgradedImplementationContract
      )) as UpgradableV2ReferralPaymentProxy;

    await upgradedProxyContract.deployed();

    // get implementation address of updated contract
    // !!! implementation contract only changes if there are changes in the contract !!!
    const upgradedImplementationAddress: string =
      await upgrades.erc1967.getImplementationAddress(proxyContract.address);

    return {
      admin,
      receiver,
      referrer,
      referee,
      proxyContract,
      proxyContractAddress,
      adminAddress,
      initialImplementationContractAddress,
      proxyAdminContractAddress,
      upgradedProxyContract,
      upgradedImplementationAddress,
    };
  }

  it("upgradable pattern works", async () => {
    const {
      proxyContract,
      initialImplementationContractAddress,
      upgradedImplementationAddress,
      upgradedProxyContract,
    } = await loadFixture(deployUpgradableFixture);

    // assertions
    expect(proxyContract.address).to.equal(upgradedProxyContract.address);
    expect(initialImplementationContractAddress).not.to.equal(
      upgradedImplementationAddress
    );
  });

  it(`${CONTRACT} should forward the correct amount / prize to the receiver account`, async () => {
    const { receiver, referrer, referee, upgradedProxyContract } =
      await loadFixture(deployUpgradableFixture);

    // get initial balances
    const initialReceiverBalance = await receiver.getBalance();

    // execute referral process
    await upgradedProxyContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // results
    const afterReceiverBalance = await receiver.getBalance();
    const receiverResult =
      initialReceiverBalance.toBigInt() + ethConverter(PRICE).toBigInt();

    // assertions
    expect(afterReceiverBalance.toBigInt()).to.equal(receiverResult);
  });

  it(`${CONTRACT} should send the reward to the referrer account`, async () => {
    const { referrer, referee, upgradedProxyContract } = await loadFixture(
      deployUpgradableFixture
    );

    // get initial balances
    const initialReferrerBalance = await referrer.getBalance();

    // await referral process
    await upgradedProxyContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // results
    const afterReferrerBalance = await referrer.getBalance();
    const referrerResult =
      initialReferrerBalance.toBigInt() +
      ethConverter(REFERRAL_REWARD).toBigInt();

    // assertions
    expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
  });

  it(`${CONTRACT} should subtract payment amount from referee account`, async () => {
    const { referrer, referee, upgradedProxyContract } = await loadFixture(
      deployUpgradableFixture
    );

    // get initial balances
    const initialRefereeBalance = await referee.getBalance();

    // await referral process transaction
    const referralTx = await upgradedProxyContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // calculate referral transaction costs
    const txReceipt = await referralTx.wait();

    // gas used by the transaction
    const txGasUsed = await txReceipt.gasUsed;
    // gas price
    const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
    // tx costs
    const txCost = txGasUsed.mul(txEffectiveGasPrice);

    // results
    const afterRefereeBalance = await referee.getBalance();
    const refereeResult =
      initialRefereeBalance.toBigInt() -
      txCost.toBigInt() -
      ethConverter(PAYMENT_AMOUNT).toBigInt();

    // assertions
    expect(afterRefereeBalance.toBigInt()).to.equal(refereeResult);
  });
});
