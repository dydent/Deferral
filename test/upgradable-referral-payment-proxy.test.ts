import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";

import {
  EXACT_AMOUNT_ERROR,
  OWNABLE_ERROR_STRING,
  REWARD_AMOUNT_PROPORTION_ERROR,
} from "../helpers/constants/error-strings";
import {
  UpgradableV1ReferralPaymentProxy,
  UpgradableV2ReferralPaymentProxy,
} from "../types";

type FixtureReturnType = {
  admin: SignerWithAddress;
  receiver: SignerWithAddress;
  updatedReceiver: SignerWithAddress;
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
    const [admin, receiver, updatedReceiver, referrer, referee] =
      await ethers.getSigners();

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
      updatedReceiver,
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

  // -----------------------------------------------------------------------------------------------
  // Testing upgrades
  // -----------------------------------------------------------------------------------------------

  describe(`OpenZeppelin Upgrades Pattern`, async () => {
    it(`Upgradable pattern works for ${CONTRACT} and ${INITIAL_CONTRACT}`, async () => {
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
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Updating Contract Values`, async () => {
    it(`${CONTRACT} should update payment amount`, async () => {
      const { admin, upgradedProxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const updatedPaymentAmount = ethConverter(5);

      // update payment amount
      await upgradedProxyContract
        .connect(admin)
        .updatePaymentAmount(updatedPaymentAmount);

      const contractPaymentAmount = await upgradedProxyContract.paymentAmount();

      // assertions
      expect(contractPaymentAmount.toBigInt()).to.equal(
        updatedPaymentAmount.toBigInt()
      );
    });

    it(`${CONTRACT} should update receiver address`, async () => {
      const { admin, updatedReceiver, upgradedProxyContract } =
        await loadFixture(deployUpgradableFixture);

      const updatedReceiverAddress = await updatedReceiver.getAddress();

      // update receiver address
      await upgradedProxyContract
        .connect(admin)
        .updateReceiverAddress(updatedReceiverAddress);

      const contractReceiverAddress = await upgradedProxyContract.receiver();

      // assertions
      expect(updatedReceiverAddress).to.equal(contractReceiverAddress);
    });

    it(`${CONTRACT} should update referral reward`, async () => {
      const { admin, upgradedProxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const updatedReferralReward = ethConverter(3);

      // update payment amount
      await upgradedProxyContract
        .connect(admin)
        .updateReferralReward(updatedReferralReward);

      const contractReferralReward =
        await upgradedProxyContract.referralReward();

      // assertions
      expect(contractReferralReward.toBigInt()).to.equal(
        updatedReferralReward.toBigInt()
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for function modifiers and conditions
  // -----------------------------------------------------------------------------------------------

  describe(`Function Modifiers`, async () => {
    it(`${CONTRACT} should throw if updated referral reward is bigger than payment`, async () => {
      const { admin, upgradedProxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const updatedReferralReward = ethConverter(PAYMENT_AMOUNT + 1);

      const expectedError = REWARD_AMOUNT_PROPORTION_ERROR;

      const referralRewardUpdatePromise = upgradedProxyContract
        .connect(admin)
        .updateReferralReward(updatedReferralReward);

      // expect to fail
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });

    it(`${CONTRACT} should throw if non-admin tries to update contract`, async () => {
      const { referrer, upgradedProxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const updatedReferralReward = ethConverter(3);
      const updatedReceiverAddress = await referrer.getAddress();

      const expectedError = OWNABLE_ERROR_STRING;

      const referralRewardUpdatePromise = upgradedProxyContract
        .connect(referrer)
        .updateReferralReward(updatedReferralReward);
      const paymentAmountUpdatePromise = upgradedProxyContract
        .connect(referrer)
        .updatePaymentAmount(updatedReferralReward);
      const receiverAddressUpdatePromise = upgradedProxyContract
        .connect(referrer)
        .updateReceiverAddress(updatedReceiverAddress);

      // await calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(paymentAmountUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Integration Testing of Referral Process / Unit testing for forwarding function
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process `, async () => {
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

      // gas used by the transaction plus gas used by the transactions executed before the current one and in the same block
      // const txCumulativeGasUsed = await txReceipt.cumulativeGasUsed;

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

    it(`${CONTRACT} should throw if payment value is not exact`, async () => {
      const { referrer, referee, upgradedProxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const expectedError = EXACT_AMOUNT_ERROR;
      // await referral process
      const referralProcessPromise = upgradedProxyContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: ethConverter(PAYMENT_AMOUNT / 2),
        });

      // await calls to be rejected since they are not owner of the contract
      await expect(referralProcessPromise).to.be.rejectedWith(expectedError);
    });
  });
});
