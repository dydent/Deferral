import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../../helpers/converters";
import { expect } from "chai";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
  SENDER_CANNOT_BE_REFERRER,
} from "../../helpers/constants/error-strings";
import { deployPaymentQuantityUpgradableFixture } from "../../helpers/test-helpers/payment-quantity-fixtures";
import { executeReferralPayment } from "../../helpers/test-helpers/execute-referral-payments";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";
import { ethers, upgrades } from "hardhat";
import { V1ReferralPaymentQuantityUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-quantity/V1ReferralPaymentQuantityUpgradable";

const CONTRACT_NAME = "V1ReferralPaymentQuantityUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

// must be between 0 and 100!
const DEFAULT_REWARD_PERCENTAGE = 30;
// default payments quantity threshold
const DEFAULT_PAYMENTS_QUANTITY_THRESHOLD = 2;

// noinspection DuplicatedCode
describe(`Testing ${CONTRACT_NAME} Referral Contract`, async () => {
  // get default fixture function for testing
  const defaultFixture = async () => {
    return deployPaymentQuantityUpgradableFixture<V1ReferralPaymentQuantityUpgradable>(
      {
        contractName: CONTRACT_NAME,
        referralPercentage: DEFAULT_REWARD_PERCENTAGE,
        quantityThreshold: DEFAULT_PAYMENTS_QUANTITY_THRESHOLD,
      }
    );
  };

  // -----------------------------------------------------------------------------------------------
  // Testing Contract Deployment
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Contract Deployment`, async () => {
    it(`${CONTRACT_NAME} should throw if deployed with incorrect params`, async () => {
      const [receiver] = await ethers.getSigners();

      const incorrectRewardPercentage = 105;

      const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

      const deployedProxyContractPromise = upgrades.deployProxy(
        referralContract,
        [
          receiver.address,
          incorrectRewardPercentage,
          DEFAULT_PAYMENTS_QUANTITY_THRESHOLD,
        ]
      );
      await expect(deployedProxyContractPromise).to.be.rejectedWith(
        REWARD_PERCENTAGE_OUT_OF_BOUNDS
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Updating Contract Values
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Updating Contract Values`, async () => {
    it(`${CONTRACT_NAME} should update receiver address`, async () => {
      const { admin, updatedReceiver, proxyContract } = await loadFixture(
        defaultFixture
      );
      // assert addresses are not the same at the start
      const initialAddress = await proxyContract.receiverAddress();
      const updateAddress = await updatedReceiver.getAddress();
      expect(initialAddress).to.not.equal(updateAddress);

      // update & assert receiver address
      await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
      const contractReceiverAddress = await proxyContract.receiverAddress();
      expect(updateAddress).to.equal(contractReceiverAddress);
    });

    it(`${CONTRACT_NAME} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 20, 100];

      // update & assert reward percentages
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateReferralReward(updatedValue);
        const contractValue = await proxyContract.rewardPercentage();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${CONTRACT_NAME} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with invalid and outbound boundary values
      const invalidUpdateValues = [101, 500];

      // update & assert reward percentage update fails
      for (const updatedValue of invalidUpdateValues) {
        const referralRewardUpdatePromise = proxyContract
          .connect(admin)
          .updateReferralReward(updatedValue);
        await expect(referralRewardUpdatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });

    it(`${CONTRACT_NAME} should update paymentsQuantityThreshold`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 6, 10];

      // update & assert payments quantity threshold
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updateQuantityThreshold(updatedValue);
        const contractValue = await proxyContract.paymentsQuantityThreshold();
        expect(contractValue).to.equal(updatedValue);
      }
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Function Modifiers
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Function Modifiers`, async () => {
    it(`${CONTRACT_NAME} should throw if non-admin tries to update contract`, async () => {
      const { referrer, updatedReceiver, proxyContract } = await loadFixture(
        defaultFixture
      );
      const nonAdminSigner = referrer;
      const validReferralReward = ethConverter(3);
      const validReceiverAddress = await updatedReceiver.getAddress();
      const validQuantityThreshold = 10;
      const expectedError = OWNABLE_ERROR_STRING;

      // execute tx with valid values and non-admin signer
      const referralRewardUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReferralReward(validReferralReward);
      const receiverAddressUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReceiverAddress(validReceiverAddress);
      const paymentsQuantityThresholdUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateQuantityThreshold(validQuantityThreshold);
      // await tx calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(paymentsQuantityThresholdUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Referral Process Functionality
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process Functionality`, async () => {
    // process testing (pt) specific  values
    const ptRewardPercentage = 25;
    const ptPaymentsQuantityThreshold = 1;
    const ptPaymentAmount = 10;

    // specific contract set up for process testing
    const processTestingFixture = async () => {
      return deployPaymentQuantityUpgradableFixture<V1ReferralPaymentQuantityUpgradable>(
        {
          contractName: CONTRACT_NAME,
          referralPercentage: ptRewardPercentage,
          quantityThreshold: ptPaymentsQuantityThreshold,
        }
      );
    };

    it(`${CONTRACT_NAME} should throw if sender/referee is referrer`, async () => {
      const { referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referee.address, {
          value: ethConverter(ptPaymentAmount),
        });
      await expect(referralTxPromise).to.be.rejectedWith(
        SENDER_CANNOT_BE_REFERRER
      );
    });

    it(`${CONTRACT_NAME} should subtract payment amount from referee account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await referee.getBalance();
      // await referral process transaction
      const referralTx = await proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(ptPaymentAmount),
        });
      const txCost = await getTransactionCosts(referralTx);

      // calculate result values
      const contractBalance = await proxyContract.getBalance();
      const afterBalance = await referee.getBalance();
      const resultBalance =
        initialBalance.toBigInt() -
        txCost.toBigInt() -
        ethConverter(ptPaymentAmount).toBigInt();
      // assert balances are correct afterwards
      expect(afterBalance.toBigInt()).to.equal(resultBalance);
      expect(contractBalance.toBigInt()).to.equal(
        ethConverter((ptPaymentAmount / 100) * ptRewardPercentage).toBigInt()
      );
    });
    it(`${CONTRACT_NAME} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await receiver.getBalance();
      const numberOfPayments = ptPaymentsQuantityThreshold + 1;
      const receiverAmount =
        ptPaymentAmount - (ptPaymentAmount / 100) * ptRewardPercentage;
      // check that forwarded amount is correct for every iteration while the referral process is ongoing
      for (const iteration of Array.from(
        { length: numberOfPayments },
        (_, i) => i + 1
      )) {
        await executeReferralPayment({
          executions: 1,
          referee,
          referrer,
          proxyContract,
          paymentValue: ptPaymentAmount,
        });
        // calculate result values
        const afterBalance = await receiver.getBalance();
        const receiverResult =
          initialBalance.toBigInt() +
          ethConverter(receiverAmount * iteration).toBigInt();
        // assert balances are correct afterwards
        expect(afterBalance.toBigInt()).to.equal(receiverResult);
      }
    });

    it(`${CONTRACT_NAME} should update the referral process data correctly during the uncompleted referral process`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await referrer.getBalance();
      // execute n payments in order for the referral process to NOT be completed
      await executeReferralPayment({
        executions: ptPaymentsQuantityThreshold,
        referee,
        referrer,
        proxyContract,
        paymentValue: ptPaymentAmount,
      });
      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(false);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paymentsValue).to.equal(
        ethConverter(ptPaymentAmount * ptPaymentsQuantityThreshold).toBigInt()
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        ptPaymentsQuantityThreshold
      );
      // assert reward has not been paid out
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();
      expect(afterReferrerBalance.toBigInt()).to.equal(
        initialBalance.toBigInt()
      );
      // assert balances are correct afterwards
      expect(contractBalance.toBigInt()).to.equal(
        ethConverter(
          (ptPaymentAmount / 100) *
            ptRewardPercentage *
            ptPaymentsQuantityThreshold
        ).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should throw if referee with completed referral tries to do a payment transaction`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = ptPaymentsQuantityThreshold + 1;
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: ptPaymentAmount,
      });
      const expectedError = REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED;
      // await another referral process transaction after the referral has been completed
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(ptPaymentAmount),
        });
      // await calls to be rejected since referral has been completed
      await expect(referralTxPromise).to.be.rejectedWith(expectedError);
    });

    it(`${CONTRACT_NAME} should send the reward to the referrer account if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await referrer.getBalance();
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = ptPaymentsQuantityThreshold + 1;
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: ptPaymentAmount,
      });
      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(true);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paymentsValue).to.equal(
        ethConverter(ptPaymentAmount * numberOfPaymentTransactions).toBigInt()
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        numberOfPaymentTransactions
      );
      // calculate result values
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();
      const expectedPaidOutReward =
        (ptPaymentAmount / 100) *
        ptRewardPercentage *
        numberOfPaymentTransactions;
      const referrerResult =
        initialBalance.toBigInt() +
        ethConverter(expectedPaidOutReward).toBigInt();
      // assert reward has been paid out after completion
      expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
      expect(contractBalance.toBigInt()).to.equal(0);
    });
  });
});
