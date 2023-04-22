import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { etherUnitConverter } from "../../helpers/unit-converters";
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
import { BigNumber } from "ethers";
import { PercentageType } from "../../types/PercentageTypes";
import { EtherUnits } from "../../types/ValidUnitTypes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractTransaction } from "ethers/lib/ethers";

// -----------------------------------------------------------------------------------------------
// TEST CONFIG VALUES
// -----------------------------------------------------------------------------------------------
const TEST_PRECISION_DELTA = 0;

const CONTRACT_NAME = "V1ReferralPaymentQuantityUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

// ETHER UNIT THAT IS USED TO CONVERT VALUES
// --> changing the ether unit can have impacts on the precision of the results
// --> can impact the test results
const DEFAULT_UNIT: EtherUnits = EtherUnits.Ether;

// must be between 0 and 100!
const DEFAULT_REWARD_PERCENTAGE: PercentageType = 25;

// default payments quantity threshold
const DEFAULT_PAYMENTS_QUANTITY_THRESHOLD: BigNumber = BigNumber.from(2);

// several tests use the same code to test the contracts since the contract include a lot of similarities
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

      const incorrectRewardPercentage: number = 105;

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
      const initialAddress: string = await proxyContract.receiverAddress();
      const updateAddress: string = await updatedReceiver.getAddress();
      expect(initialAddress).to.not.equal(updateAddress);

      // update & assert receiver address
      await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
      const contractReceiverAddress: string =
        await proxyContract.receiverAddress();
      expect(updateAddress).to.equal(contractReceiverAddress);
    });

    it(`${CONTRACT_NAME} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues: PercentageType[] = [0, 20, 100];

      // update & assert reward percentages
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateReferralReward(updatedValue);
        const contractValue: BigNumber = await proxyContract.rewardPercentage();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${CONTRACT_NAME} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with invalid and outbound boundary values
      const invalidUpdateValues: number[] = [101, 500];

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
      const validUpdateValues: BigNumber[] = [
        BigNumber.from(4),
        BigNumber.from(6),
        BigNumber.from(10),
      ];

      // update & assert payments quantity threshold
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updateQuantityThreshold(updatedValue);
        const contractValue: BigNumber =
          await proxyContract.paymentsQuantityThreshold();
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

      const nonAdminSigner: SignerWithAddress = referrer;
      const validReferralReward: BigNumber =
        etherUnitConverter[DEFAULT_UNIT](3);
      const validReceiverAddress: string = await updatedReceiver.getAddress();
      const validQuantityThreshold: BigNumber = BigNumber.from(10);
      const expectedError: string = OWNABLE_ERROR_STRING;

      // execute tx with valid values and non-admin signer
      const referralRewardUpdatePromise: Promise<ContractTransaction> =
        proxyContract
          .connect(nonAdminSigner)
          .updateReferralReward(validReferralReward);
      const receiverAddressUpdatePromise: Promise<ContractTransaction> =
        proxyContract
          .connect(nonAdminSigner)
          .updateReceiverAddress(validReceiverAddress);
      const paymentsQuantityThresholdUpdatePromise: Promise<ContractTransaction> =
        proxyContract
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
    const ptRewardPercentage: PercentageType = 25;
    const ptPaymentsQuantityThreshold: BigNumber = BigNumber.from(1);
    const ptPaymentAmount: BigNumber = etherUnitConverter[DEFAULT_UNIT](10);

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
          value: ptPaymentAmount,
        });
      await expect(referralTxPromise).to.be.rejectedWith(
        SENDER_CANNOT_BE_REFERRER
      );
    });

    it(`${CONTRACT_NAME} should subtract payment amount from referee account`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await referee.getBalance();

      // await referral process transaction
      const referralTx = await proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ptPaymentAmount,
        });
      const txCost: BigNumber = await getTransactionCosts(referralTx);

      // calculate result values
      const contractBalance: BigNumber = await proxyContract.getBalance();
      const afterBalance: BigNumber = await referee.getBalance();
      const resultBalance: BigNumber = initialBalance
        .sub(txCost)
        .sub(ptPaymentAmount);

      // assert balances are correct afterwards
      expect(afterBalance).to.be.closeTo(resultBalance, TEST_PRECISION_DELTA);
      expect(contractBalance).to.be.closeTo(
        ptPaymentAmount.mul(ptRewardPercentage).div(100),
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await receiver.getBalance();
      const numberOfPayments: BigNumber = ptPaymentsQuantityThreshold.add(1);
      const receiverAmount: BigNumber = ptPaymentAmount.sub(
        ptPaymentAmount.mul(ptRewardPercentage).div(100)
      );
      // check that forwarded amount is correct for every iteration while the referral process is ongoing
      for (const iteration of Array.from(
        { length: numberOfPayments.toNumber() },
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
        const afterBalance: BigNumber = await receiver.getBalance();
        const receiverResult: BigNumber = initialBalance.add(
          receiverAmount.mul(iteration)
        );
        // assert balances are correct afterwards
        expect(afterBalance).to.be.closeTo(
          receiverResult,
          TEST_PRECISION_DELTA
        );
      }
    });

    it(`${CONTRACT_NAME} should update the referral process data correctly during the uncompleted referral process`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await referrer.getBalance();
      // execute n payments in order for the referral process to NOT be completed
      await executeReferralPayment({
        executions: ptPaymentsQuantityThreshold.toNumber(),
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
        ptPaymentAmount.mul(ptPaymentsQuantityThreshold)
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        ptPaymentsQuantityThreshold
      );
      // assert reward has not been paid out
      const afterReferrerBalance: BigNumber = await referrer.getBalance();
      const contractBalance: BigNumber = await proxyContract.getBalance();

      // assert balances are correct afterwards
      expect(afterReferrerBalance).to.be.closeTo(
        initialBalance,
        TEST_PRECISION_DELTA
      );
      expect(contractBalance).to.be.closeTo(
        ptPaymentAmount
          .mul(ptRewardPercentage)
          .div(100)
          .mul(ptPaymentsQuantityThreshold),
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should throw if referee with completed referral tries to do a payment transaction`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions: BigNumber =
        ptPaymentsQuantityThreshold.add(1);
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions.toNumber(),
        referee,
        referrer,
        proxyContract,
        paymentValue: ptPaymentAmount,
      });
      const expectedError: string = REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED;
      // await another referral process transaction after the referral has been completed
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: ptPaymentAmount,
        });
      // await calls to be rejected since referral has been completed
      await expect(referralTxPromise).to.be.rejectedWith(expectedError);
    });

    it(`${CONTRACT_NAME} should send the reward to the referrer account if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await referrer.getBalance();
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions: BigNumber =
        ptPaymentsQuantityThreshold.add(1);
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions.toNumber(),
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
        ptPaymentAmount.mul(numberOfPaymentTransactions)
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        numberOfPaymentTransactions
      );
      // calculate result values
      const afterReferrerBalance: BigNumber = await referrer.getBalance();
      const contractBalance: BigNumber = await proxyContract.getBalance();
      const expectedPaidOutReward: BigNumber = ptPaymentAmount
        .mul(ptRewardPercentage)
        .div(100)
        .mul(numberOfPaymentTransactions);

      const referrerResult: BigNumber = initialBalance.add(
        expectedPaidOutReward
      );

      // assert reward has been paid out after completion
      expect(afterReferrerBalance).to.be.closeTo(
        referrerResult,
        TEST_PRECISION_DELTA
      );
      expect(contractBalance).to.be.closeTo(0, TEST_PRECISION_DELTA);
    });
  });
});
