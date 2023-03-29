import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../../helpers/unit-converters";
import { expect } from "chai";
import {
  NO_REWARDS_TO_CLAIM,
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
  SENDER_CANNOT_BE_REFERRER,
} from "../../helpers/constants/error-strings";
import { deployPaymentValueUpgradableFixture } from "../../helpers/test-helpers/payment-value-fixtures";
import { executeReferralPayment } from "../../helpers/test-helpers/execute-referral-payments";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";
import { ethers, upgrades } from "hardhat";
import { V2ReferralPaymentValueUpgradable } from "../../typechain-types";

const CONTRACT_NAME = "V2ReferralPaymentValueUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

// must be between 0 and 100!
const DEFAULT_REWARD_PERCENTAGE = 30;
// default payments value threshold
const DEFAULT_PAYMENTS_VALUE_THRESHOLD = 50;

// noinspection DuplicatedCode
describe(`Testing ${CONTRACT_NAME} Referral Contract`, async () => {
  // get default fixture function for testing
  const defaultFixture = async () => {
    return deployPaymentValueUpgradableFixture<V2ReferralPaymentValueUpgradable>(
      {
        contractName: CONTRACT_NAME,
        referralPercentage: DEFAULT_REWARD_PERCENTAGE,
        valueThreshold: DEFAULT_PAYMENTS_VALUE_THRESHOLD,
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
          DEFAULT_PAYMENTS_VALUE_THRESHOLD,
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

    it(`${CONTRACT_NAME} should update paymentsValueThreshold`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 6, 10];

      // update & assert payments value threshold
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updateValueThreshold(ethConverter(updatedValue));
        const contractValue = await proxyContract.paymentsValueThreshold();
        expect(contractValue.toBigInt()).to.equal(ethConverter(updatedValue));
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
      const validValueThreshold = ethConverter(65);
      const expectedError = OWNABLE_ERROR_STRING;

      // execute tx with valid values and non-admin signer
      const referralRewardUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReferralReward(validReferralReward);
      const receiverAddressUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReceiverAddress(validReceiverAddress);
      const requiredAmountOfPaymentsUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateValueThreshold(validValueThreshold);
      // await tx calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(requiredAmountOfPaymentsUpdatePromise).to.be.rejectedWith(
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
    const ptPaymentsValueThreshold = 20;
    const ptPaymentAmount = 10;

    // specific contract set up for process testing
    const processTestingFixture = async () => {
      return deployPaymentValueUpgradableFixture<V2ReferralPaymentValueUpgradable>(
        {
          contractName: CONTRACT_NAME,
          referralPercentage: ptRewardPercentage,
          valueThreshold: ptPaymentsValueThreshold,
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
      const initialRefereeBalance = await referee.getBalance();

      // await referral process tx
      const referralTx = await proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(ptPaymentAmount),
        });

      const txCost = await getTransactionCosts(referralTx);

      const contractBalance = await proxyContract.getBalance();
      const afterRefereeBalance = await referee.getBalance();

      // calculate expected result values
      const expectedRefereeBalance =
        initialRefereeBalance.toBigInt() -
        txCost.toBigInt() -
        ethConverter(ptPaymentAmount).toBigInt();

      const expectedContractBalance = ethConverter(
        (ptPaymentAmount / 100) * ptRewardPercentage
      ).toBigInt();

      // assert balances are correct afterwards
      expect(afterRefereeBalance.toBigInt()).to.equal(expectedRefereeBalance);
      expect(contractBalance).to.equal(expectedContractBalance);
    });

    it(`${CONTRACT_NAME} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await receiver.getBalance();
      const numberOfPayments = 2;
      const paymentValue = ptPaymentAmount / numberOfPayments;

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
          paymentValue: paymentValue,
        });
        const contractBalance = await proxyContract.getBalance();

        const afterReceiverBalance = await receiver.getBalance();

        // calculate expected results values
        const expectedReceiverResult =
          initialBalance.toBigInt() +
          ethConverter(
            (paymentValue - (paymentValue / 100) * ptRewardPercentage) *
              iteration
          ).toBigInt();

        const expectedContractBalance = ethConverter(
          (paymentValue / 100) * ptRewardPercentage * iteration
        ).toBigInt();

        // assert balances are correct afterwards
        expect(afterReceiverBalance.toBigInt()).to.equal(
          expectedReceiverResult
        );
        expect(contractBalance).to.equal(expectedContractBalance);
      }
    });

    it(`${CONTRACT_NAME} should update the referral process data correctly during the uncompleted referral process`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await referrer.getBalance();
      const numberOfPaymentTxs = 4;
      const paymentValue = ptPaymentsValueThreshold / numberOfPaymentTxs;
      // execute n payments in order for the referral process to NOT be completed
      await executeReferralPayment({
        executions: numberOfPaymentTxs,
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(false);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paymentsValue.toBigInt()).to.equal(
        ethConverter(paymentValue * numberOfPaymentTxs).toBigInt()
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        numberOfPaymentTxs
      );
      // assert reward has not been paid out
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();
      // assert balances are correct afterwards
      expect(afterReferrerBalance.toBigInt()).to.equal(
        initialBalance.toBigInt()
      );
      expect(contractBalance.toBigInt()).to.equal(
        ethConverter(
          ((numberOfPaymentTxs * paymentValue) / 100) * ptRewardPercentage
        ).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should throw if referee with completed referral tries to do a payment transaction`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = 2;
      const paymentValue = ptPaymentsValueThreshold;

      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const expectedError = REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED;
      // await another referral process transaction after the referral has been completed
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ethConverter(paymentValue),
        });
      // await calls to be rejected since referral has been completed
      await expect(referralTxPromise).to.be.rejectedWith(expectedError);
    });

    it(`${CONTRACT_NAME} should allocate the reward to the referrer and make it claimable if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance = await referrer.getBalance();
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions = 2;
      const paymentValue = ptPaymentsValueThreshold;
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions,
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(referralProcessMapping.referralProcessCompleted).to.equal(true);
      expect(referralProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referralProcessMapping.referrerAddress).to.equal(referrer.address);
      expect(referralProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue * numberOfPaymentTransactions).toBigInt()
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        numberOfPaymentTransactions
      );

      // calculate reward values
      const expectedPaidOutReward =
        (paymentValue / 100) * ptRewardPercentage * numberOfPaymentTransactions;

      // assert correct reward amount is claimable for referrer
      const claimableReferrerReward =
        await proxyContract.claimableRewardMapping(referrer.address);
      expect(claimableReferrerReward.toBigInt()).to.equal(
        ethConverter(expectedPaidOutReward).toBigInt()
      );

      // claim rewards with referrer
      const claimReferrerRewardTx = await proxyContract
        .connect(referrer)
        .claimRewards();

      const txCost = await getTransactionCosts(claimReferrerRewardTx);

      // calculate result values
      const afterReferrerBalance = await referrer.getBalance();
      const contractBalance = await proxyContract.getBalance();

      // initial balance + claimed reward - claim tx cost
      const referrerResult =
        initialBalance.toBigInt() +
        ethConverter(expectedPaidOutReward).toBigInt() -
        txCost.toBigInt();

      // assert reward has been paid out after completion
      expect(afterReferrerBalance.toBigInt()).to.equal(referrerResult);
      expect(contractBalance.toBigInt()).to.equal(0);
    });

    it(`${CONTRACT_NAME} should throw if no rewards are available to claim`, async () => {
      const { referee, proxyContract } = await loadFixture(defaultFixture);

      const claimTxPromise = proxyContract.connect(referee).claimRewards();

      await expect(claimTxPromise).to.be.rejectedWith(NO_REWARDS_TO_CLAIM);
    });
  });
});
