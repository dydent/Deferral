import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../../helpers/converters";
import { expect } from "chai";
import { REWARD_AMOUNT_PROPORTION_ERROR } from "../../helpers/constants/error-strings";
import { deployUpgradableReferralPaymentTransmitter } from "../../helpers/test-helpers/payment-transmitter-fixtures";
import { V2ReferralPaymentTransmitterUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-transmitter/upgradable-contracts/V2ReferralPaymentTransmitterUpgradable";
import { ethers, upgrades } from "hardhat";

const CONTRACT_NAME = "V2ReferralPaymentTransmitterUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const DEFAULT_PAYMENT_AMOUNT: number = 10;
// must be smaller than payment amount
const DEFAULT_REFERRAL_REWARD = 1;

describe(`Testing ${CONTRACT_NAME} Referral Contract`, async () => {
  // helper function to deploy the referral contract
  const defaultFixture = async () => {
    return deployUpgradableReferralPaymentTransmitter<V2ReferralPaymentTransmitterUpgradable>(
      {
        contractName: CONTRACT_NAME,
        paymentAmount: DEFAULT_PAYMENT_AMOUNT,
        referralReward: DEFAULT_REFERRAL_REWARD,
      }
    );
  };

  // -----------------------------------------------------------------------------------------------
  // Testing Contract Deployment
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Contract Deployment`, async () => {
    it(`${CONTRACT_NAME} should deploy upgradable contract with correct params`, async () => {
      const { receiver, proxyContract } = await loadFixture(defaultFixture);

      const contractReward = await proxyContract.referralReward();
      const contractPaymentAmount = await proxyContract.paymentAmount();
      const contractReceiverAddress = await proxyContract.receiver();

      // assertions
      expect(contractReward.toBigInt()).to.equal(
        ethConverter(DEFAULT_REFERRAL_REWARD).toBigInt()
      );
      expect(contractPaymentAmount.toBigInt()).to.equal(
        ethConverter(DEFAULT_PAYMENT_AMOUNT).toBigInt()
      );
      expect(contractReceiverAddress).to.equal(receiver.address);
    });

    it(`${CONTRACT_NAME} should throw if deployed with incorrect params`, async () => {
      const [receiver] = await ethers.getSigners();

      const paymentAmountParam = ethConverter(DEFAULT_PAYMENT_AMOUNT);
      const incorrectReferralRewardParam = ethConverter(
        DEFAULT_PAYMENT_AMOUNT + 1
      );

      const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

      const deployedProxyContractPromise = upgrades.deployProxy(
        referralContract,
        [receiver.address, paymentAmountParam, incorrectReferralRewardParam]
      );
      await expect(deployedProxyContractPromise).to.be.rejectedWith(
        REWARD_AMOUNT_PROPORTION_ERROR
      );
    });
  });
});
