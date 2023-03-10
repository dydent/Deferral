import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  OWNABLE_ERROR_STRING,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
} from "../helpers/constants/error-strings";
import {
  deployPaymentQuantityUpgradableFixture,
  PAYMENT_QUANTITY_AMOUNT_CONTRACT,
  QUANTITY_PAYMENT_AMOUNT,
  QUANTITY_PAYMENT_AMOUNT_PRIZE,
  QUANTITY_THRESHOLD,
  REFERRAL_PERCENTAGE,
} from "../helpers/test-helpers/payment-quantity-fixtures";
import { V1ReferralQuantityPaymentUpgradable } from "../typechain-types";

describe("Testing quantity payment referral contracts", async () => {
  // get fixture function
  const deployUpgradableFixture = deployPaymentQuantityUpgradableFixture;

  // helper function to execute payments to the referral contract
  async function executeReferralPayment({
    nTimes,
    referee,
    referrer,
    proxyContract,
    paymentValue,
  }: {
    nTimes: number;
    referee: SignerWithAddress;
    referrer: SignerWithAddress;
    proxyContract: V1ReferralQuantityPaymentUpgradable;
    paymentValue: number;
  }): Promise<void> {
    for (let i = 0; i < nTimes; i++) {
      const referrerAddress = await referrer.getAddress();
      // await referral process
      await proxyContract
        .connect(referee)
        .forwardReferralPayment(referrerAddress, {
          value: ethConverter(paymentValue),
        });
    }
  }

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Updating Contract Values`, async () => {
    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should update receiver address`, async () => {
      const { admin, receiver, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const receiverAddress = await receiver.getAddress();

      // update receiver address
      await proxyContract.connect(admin).updateReceiverAddress(receiverAddress);

      const contractReceiverAddress = await proxyContract.receiverAddress();

      // assertions
      expect(receiverAddress).to.equal(contractReceiverAddress);
    });

    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // test with regular and inbound boundary values
      const validUpdatedReferralRewardPercentages = [0, 20, 100];

      for (const updatedValue of validUpdatedReferralRewardPercentages) {
        // update payment amount
        await proxyContract.connect(admin).updateReferralReward(updatedValue);

        const contractReferralRewardPercentage =
          await proxyContract.rewardPercentage();

        // assertions
        expect(contractReferralRewardPercentage).to.equal(updatedValue);
      }
    });
    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // test with invalid and outbound boundary values
      const invalidUpdatedReferralRewardPercentages = [101, 500];

      for (const updatedValue of invalidUpdatedReferralRewardPercentages) {
        const referralRewardUpdatePromise = proxyContract
          .connect(admin)
          .updateReferralReward(updatedValue);

        // expect to fail
        await expect(referralRewardUpdatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for function modifiers and conditions
  // -----------------------------------------------------------------------------------------------

  describe(`Function Modifiers`, async () => {
    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should throw if non-admin tries to update contract`, async () => {
      const { referrer, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      const updatedReferralReward = ethConverter(3);
      const receiverAddress = await referrer.getAddress();

      const expectedError = OWNABLE_ERROR_STRING;

      const referralRewardUpdatePromise = proxyContract
        .connect(referrer)
        .updateReferralReward(updatedReferralReward);
      const receiverAddressUpdatePromise = proxyContract
        .connect(referrer)
        .updateReceiverAddress(receiverAddress);

      // await calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
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
    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // get initial balances
      const initialReceiverBalance = await receiver.getBalance();

      await executeReferralPayment({
        nTimes: 1,
        referee,
        referrer,
        proxyContract,
        paymentValue: QUANTITY_PAYMENT_AMOUNT,
      });

      // results
      const afterReceiverBalance = await receiver.getBalance();
      const receiverResult =
        initialReceiverBalance.toBigInt() +
        ethConverter(QUANTITY_PAYMENT_AMOUNT_PRIZE).toBigInt();

      // assertions
      expect(afterReceiverBalance.toBigInt()).to.equal(receiverResult);
    });

    // TODO fix this
    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should send the reward to the referrer account if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // get initial balances
      const initialReferrerBalance = await referrer.getBalance();

      const numberOfPaymentTransactions = QUANTITY_THRESHOLD + 1;
      //
      await executeReferralPayment({
        nTimes: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: QUANTITY_PAYMENT_AMOUNT,
      });

      // results
      const afterReferrerBalance = await referrer.getBalance();

      const expectedPaidOutReward =
        (QUANTITY_PAYMENT_AMOUNT / 100) *
        REFERRAL_PERCENTAGE *
        numberOfPaymentTransactions;

      const referrerResult =
        initialReferrerBalance.toBigInt() +
        ethConverter(expectedPaidOutReward).toBigInt();

      // assertions
      expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
    });

    it(`${PAYMENT_QUANTITY_AMOUNT_CONTRACT} should subtract payment amount from referee account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );

      // get initial balances
      const initialRefereeBalance = await referee.getBalance();

      // await referral process transaction
      const referralTx = await proxyContract
        .connect(referee)
        .forwardReferralPayment(referrer.address, {
          value: ethConverter(QUANTITY_PAYMENT_AMOUNT),
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
        ethConverter(QUANTITY_PAYMENT_AMOUNT).toBigInt();

      // assertions
      expect(afterRefereeBalance.toBigInt()).to.equal(refereeResult);
    });
  });
});
