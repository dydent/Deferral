import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { etherUnitConverter } from "../../helpers/unit-converters";
import { expect } from "chai";
import { REWARD_AMOUNT_PROPORTION_ERROR } from "../../helpers/constants/error-strings";
import { deployUpgradableReferralPaymentTransmitter } from "../../helpers/test-helpers/payment-transmitter-fixtures";
import { ethers, upgrades } from "hardhat";
import { V2ReferralPaymentTransmitterUpgradable } from "../../typechain-types";
import { BigNumber } from "ethers";
import { EtherUnits } from "../../types/ValidUnitTypes";

// -----------------------------------------------------------------------------------------------
// TEST CONFIG VALUES
// -----------------------------------------------------------------------------------------------
const TEST_PRECISION_DELTA = 0;

const CONTRACT_NAME = "V2ReferralPaymentTransmitterUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const DEFAULT_UNIT: EtherUnits = EtherUnits.Ether;
const DEFAULT_PAYMENT_AMOUNT: BigNumber = etherUnitConverter[DEFAULT_UNIT](
  BigNumber.from(10)
);
// must be smaller than payment amount
const DEFAULT_REFERRAL_REWARD: BigNumber = etherUnitConverter[DEFAULT_UNIT](
  BigNumber.from(1)
);

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

      const contractReward: BigNumber = await proxyContract.referralReward();
      const contractPaymentAmount: BigNumber =
        await proxyContract.paymentAmount();
      const contractReceiverAddress: string = await proxyContract.receiver();

      // assertions
      expect(contractReward).to.be.closeTo(
        DEFAULT_REFERRAL_REWARD,
        TEST_PRECISION_DELTA
      );
      expect(contractPaymentAmount).to.be.closeTo(
        DEFAULT_PAYMENT_AMOUNT,
        TEST_PRECISION_DELTA
      );
      expect(contractReceiverAddress).to.equal(receiver.address);
    });

    it(`${CONTRACT_NAME} should throw if deployed with incorrect params`, async () => {
      const [receiver] = await ethers.getSigners();

      const paymentAmountParam: BigNumber = DEFAULT_PAYMENT_AMOUNT;
      const incorrectReferralRewardParam: BigNumber =
        DEFAULT_PAYMENT_AMOUNT.add(
          etherUnitConverter[DEFAULT_UNIT](BigNumber.from(1))
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
