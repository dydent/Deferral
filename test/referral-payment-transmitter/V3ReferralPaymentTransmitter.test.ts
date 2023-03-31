import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { etherUnitConverter } from "../../helpers/unit-converters";
import { expect } from "chai";
import {
  EXACT_AMOUNT_ERROR,
  OWNABLE_ERROR_STRING,
  REWARD_AMOUNT_PROPORTION_ERROR,
  SENDER_CANNOT_BE_REFERRER,
} from "../../helpers/constants/error-strings";
import { deployUpgradableReferralPaymentTransmitter } from "../../helpers/test-helpers/payment-transmitter-fixtures";
import { ethers, upgrades } from "hardhat";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";
import { V3ReferralPaymentTransmitterUpgradable } from "../../typechain-types";
import { BigNumber, ContractTransaction } from "ethers";
import { EtherUnits } from "../../types/ValidUnitTypes";

// -----------------------------------------------------------------------------------------------
// TEST CONFIG VALUES
// -----------------------------------------------------------------------------------------------
const TEST_PRECISION_DELTA = 0;

const CONTRACT_NAME = "V3ReferralPaymentTransmitterUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const DEFAULT_UNIT: EtherUnits = EtherUnits.Ether;
const DEFAULT_PAYMENT_AMOUNT: BigNumber = etherUnitConverter[DEFAULT_UNIT](10);
// must be smaller than payment amount
const DEFAULT_REFERRAL_REWARD: BigNumber = etherUnitConverter[DEFAULT_UNIT](1);
const DEFAULT_PRICE: BigNumber = DEFAULT_PAYMENT_AMOUNT.sub(
  DEFAULT_REFERRAL_REWARD
);

describe(`Testing ${CONTRACT_NAME} Referral Contract`, async () => {
  // helper function to deploy the referral contract
  const defaultFixture = async () => {
    return deployUpgradableReferralPaymentTransmitter<V3ReferralPaymentTransmitterUpgradable>(
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
    it(`${CONTRACT_NAME} should throw if deployed with incorrect params`, async () => {
      const [receiver] = await ethers.getSigners();

      const paymentAmountParam: BigNumber = DEFAULT_PAYMENT_AMOUNT;
      const incorrectReferralRewardParam: BigNumber =
        DEFAULT_PAYMENT_AMOUNT.add(etherUnitConverter[DEFAULT_UNIT](1));

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

  // -----------------------------------------------------------------------------------------------
  // Testing Updating Contract Values
  // -----------------------------------------------------------------------------------------------
  describe(`Updating Contract Values`, async () => {
    it(`${CONTRACT_NAME} should update receiver address`, async () => {
      const { admin, updatedReceiver, proxyContract } = await loadFixture(
        defaultFixture
      );
      // assert addresses are not the same at the start
      const initialAddress: string = await proxyContract.receiver();
      const updateAddress: string = await updatedReceiver.getAddress();
      expect(initialAddress).to.not.equal(updateAddress);

      // update & assert receiver address
      await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
      const contractReceiverAddress: string = await proxyContract.receiver();
      expect(updateAddress).to.equal(contractReceiverAddress);
    });

    it(`${CONTRACT_NAME} should update payment amount`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);

      const updatedPaymentAmount: BigNumber = DEFAULT_PAYMENT_AMOUNT.add(
        etherUnitConverter[DEFAULT_UNIT](2)
      );

      // update payment amount
      await proxyContract
        .connect(admin)
        .updatePaymentAmount(updatedPaymentAmount);

      const contractPaymentAmount: BigNumber =
        await proxyContract.paymentAmount();

      // assertions
      expect(contractPaymentAmount).to.be.closeTo(
        updatedPaymentAmount,
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should throw if updated payment amount is smaller than reward`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);

      const updatedPaymentAmount: BigNumber = DEFAULT_REFERRAL_REWARD.sub(
        etherUnitConverter[DEFAULT_UNIT](1)
      );

      const expectedError: string = REWARD_AMOUNT_PROPORTION_ERROR;

      const paymentAmountUpdatePromise = proxyContract
        .connect(admin)
        .updatePaymentAmount(updatedPaymentAmount);

      // expect to fail
      await expect(paymentAmountUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });

    it(`${CONTRACT_NAME} should update referral reward`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);

      const updatedReferralReward: BigNumber = DEFAULT_REFERRAL_REWARD.add(
        etherUnitConverter[DEFAULT_UNIT](1)
      );
      // update payment amount
      await proxyContract
        .connect(admin)
        .updateReferralReward(updatedReferralReward);

      const contractReferralReward: BigNumber =
        await proxyContract.referralReward();

      // assertions
      expect(contractReferralReward).to.be.closeTo(
        updatedReferralReward,
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should throw if updated referral reward is bigger than payment`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);

      const updatedReferralReward: BigNumber = DEFAULT_PAYMENT_AMOUNT.add(
        etherUnitConverter[DEFAULT_UNIT](1)
      );
      const expectedError: string = REWARD_AMOUNT_PROPORTION_ERROR;

      const referralRewardUpdatePromise = proxyContract
        .connect(admin)
        .updateReferralReward(updatedReferralReward);

      // expect to fail
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Function Modifiers
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Function Modifiers`, async () => {
    it(`${CONTRACT_NAME} should throw if non-admin tries to update contract`, async () => {
      const { referrer, proxyContract } = await loadFixture(defaultFixture);

      const updatedReferralReward: BigNumber = DEFAULT_REFERRAL_REWARD.add(
        etherUnitConverter[DEFAULT_UNIT](1)
      );
      const updatedReceiverAddress: string = await referrer.getAddress();

      const expectedError: string = OWNABLE_ERROR_STRING;

      const referralRewardUpdatePromise: Promise<ContractTransaction> =
        proxyContract
          .connect(referrer)
          .updateReferralReward(updatedReferralReward);
      const paymentAmountUpdatePromise: Promise<ContractTransaction> =
        proxyContract
          .connect(referrer)
          .updatePaymentAmount(updatedReferralReward);
      const receiverAddressUpdatePromise: Promise<ContractTransaction> =
        proxyContract
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

    it(`${CONTRACT_NAME} should throw if payment value is not exact`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        defaultFixture
      );

      const expectedError: string = EXACT_AMOUNT_ERROR;
      // await referral process
      const referralProcessPromise: Promise<ContractTransaction> = proxyContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: DEFAULT_PAYMENT_AMOUNT.add(
            etherUnitConverter[DEFAULT_UNIT](1)
          ),
        });

      // await calls to be rejected since they are not owner of the contract
      await expect(referralProcessPromise).to.be.rejectedWith(expectedError);
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Referral Process Functionality
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process Functionality`, async () => {
    it(`${CONTRACT_NAME} should throw if sender/referee is referrer`, async () => {
      const { referee, proxyContract } = await loadFixture(defaultFixture);
      const referralTxPromise = proxyContract
        .connect(referee)
        .forwardReferralPayment(referee.address, {
          value: DEFAULT_PAYMENT_AMOUNT,
        });
      await expect(referralTxPromise).to.be.rejectedWith(
        SENDER_CANNOT_BE_REFERRER
      );
    });

    it(`${CONTRACT_NAME} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        defaultFixture
      );

      // get initial balances
      const initialReceiverBalance: BigNumber = await receiver.getBalance();

      // execute referral process
      await proxyContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: DEFAULT_PAYMENT_AMOUNT,
        });

      // results
      const afterReceiverBalance: BigNumber = await receiver.getBalance();
      const receiverResult: BigNumber =
        initialReceiverBalance.add(DEFAULT_PRICE);

      // assertions
      expect(afterReceiverBalance).to.be.closeTo(
        receiverResult,
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should send the reward to the referrer account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        defaultFixture
      );

      // get initial balances
      const initialReferrerBalance: BigNumber = await referrer.getBalance();

      // await referral process
      await proxyContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: DEFAULT_PAYMENT_AMOUNT,
        });

      // results
      const afterReferrerBalance: BigNumber = await referrer.getBalance();
      const referrerResult: BigNumber = initialReferrerBalance.add(
        DEFAULT_REFERRAL_REWARD
      );

      // assertions
      expect(afterReferrerBalance).to.be.closeTo(
        referrerResult,
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should subtract payment amount from referee account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        defaultFixture
      );

      // get initial balances
      const initialRefereeBalance: BigNumber = await referee.getBalance();

      // await referral process transaction
      const referralTx = await proxyContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: DEFAULT_PAYMENT_AMOUNT,
        });

      const txCost: BigNumber = await getTransactionCosts(referralTx);

      // results
      const afterRefereeBalance: BigNumber = await referee.getBalance();
      const refereeResult: BigNumber = initialRefereeBalance
        .sub(txCost)
        .sub(DEFAULT_PAYMENT_AMOUNT);

      // assertions
      expect(afterRefereeBalance).to.be.closeTo(
        refereeResult,
        TEST_PRECISION_DELTA
      );
    });
  });
});
