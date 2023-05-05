import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { etherUnitConverter } from "../../helpers/unit-converters";
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
import { BigNumber, ContractTransaction } from "ethers";
import { EtherUnits } from "../../types/ValidUnitTypes";
import { PercentageType } from "../../types/PercentageTypes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

// -----------------------------------------------------------------------------------------------
// TEST CONFIG VALUES
// -----------------------------------------------------------------------------------------------
const TEST_PRECISION_DELTA = 0;

const CONTRACT_NAME = "V2ReferralPaymentValueUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

// ETHER UNIT THAT IS USED TO CONVERT VALUES
// --> changing the ether unit can have impacts on the precision of the results
// --> can impact the test results
const DEFAULT_UNIT: EtherUnits = EtherUnits.Ether;

// must be between 0 and 100!
const DEFAULT_REWARD_PERCENTAGE: PercentageType = 30;

// default payments value threshold
const DEFAULT_PAYMENTS_VALUE_THRESHOLD: BigNumber =
  etherUnitConverter[DEFAULT_UNIT](50);

// several tests use the same code to test the contracts since the contract include a lot of similarities
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

      const incorrectRewardPercentage: number = 105;

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

    it(`${CONTRACT_NAME} should update paymentsValueThreshold`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues: BigNumber[] = [
        etherUnitConverter[DEFAULT_UNIT](4),
        etherUnitConverter[DEFAULT_UNIT](6),
        etherUnitConverter[DEFAULT_UNIT](10),
      ];
      // update & assert payments value threshold
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateValueThreshold(updatedValue);
        const contractValue: BigNumber =
          await proxyContract.paymentsValueThreshold();
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
      const validReferralReward: PercentageType = 20;
      const validReceiverAddress: string = await updatedReceiver.getAddress();
      const validValueThreshold: BigNumber =
        etherUnitConverter[DEFAULT_UNIT](65);
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
      const requiredAmountOfPaymentsUpdatePromise: Promise<ContractTransaction> =
        proxyContract
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
    const ptUnit = EtherUnits.Ether;
    const ptRewardPercentage: PercentageType = 25;
    const ptPaymentsValueThreshold: BigNumber = etherUnitConverter[ptUnit](5);
    const ptPaymentAmount: BigNumber = etherUnitConverter[ptUnit](10);

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

      const paymentAmount: BigNumber = ptPaymentsValueThreshold;

      const initialRefereeBalance: BigNumber = await referee.getBalance();

      // await referral process tx
      const referralTx = await proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: paymentAmount,
        });

      const txCost: BigNumber = await getTransactionCosts(referralTx);

      const contractBalance: BigNumber = await proxyContract.getBalance();
      const afterRefereeBalance: BigNumber = await referee.getBalance();

      // calculate expected result values
      const expectedRefereeBalance: BigNumber = initialRefereeBalance
        .sub(txCost)
        .sub(paymentAmount);

      const expectedContractBalance: BigNumber = paymentAmount
        .mul(ptRewardPercentage)
        .div(100);

      // assert balances are correct afterwards
      expect(afterRefereeBalance).to.be.closeTo(
        expectedRefereeBalance,
        TEST_PRECISION_DELTA
      );

      expect(contractBalance).to.be.closeTo(
        expectedContractBalance,
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should forward the correct amount / prize to the receiver account`, async () => {
      const { receiver, referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await receiver.getBalance();
      const numberOfPayments: BigNumber = BigNumber.from(2);
      const paymentValue: BigNumber =
        ptPaymentsValueThreshold.div(numberOfPayments);

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
          paymentValue: paymentValue,
        });

        const contractBalance: BigNumber = await proxyContract.getBalance();

        const afterReceiverBalance: BigNumber = await receiver.getBalance();

        const rewardValue: BigNumber = paymentValue
          .mul(ptRewardPercentage)
          .div(100)
          .mul(iteration);

        const forwardedValue: BigNumber = paymentValue
          .mul(iteration)
          .sub(rewardValue);

        // calculate expected results values
        const expectedReceiverResult: BigNumber =
          initialBalance.add(forwardedValue);

        const expectedContractBalance: BigNumber = rewardValue;

        // assert balances are correct afterwards
        expect(afterReceiverBalance).to.be.closeTo(
          expectedReceiverResult,
          TEST_PRECISION_DELTA
        );
        expect(contractBalance).to.be.closeTo(
          expectedContractBalance,
          TEST_PRECISION_DELTA
        );
      }
    });

    it(`${CONTRACT_NAME} should update the referral process data correctly during the uncompleted referral process`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await referrer.getBalance();
      const numberOfPaymentTxs: BigNumber = BigNumber.from(4);
      const paymentValue: BigNumber =
        ptPaymentsValueThreshold.div(numberOfPaymentTxs);
      // execute n payments in order for the referral process to NOT be completed
      await executeReferralPayment({
        executions: numberOfPaymentTxs.toNumber(),
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
      expect(referralProcessMapping.paymentsValue).to.equal(
        paymentValue.mul(numberOfPaymentTxs)
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        numberOfPaymentTxs
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
        numberOfPaymentTxs.mul(paymentValue.div(100).mul(ptRewardPercentage)),
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should throw if referee with completed referral tries to do a payment transaction`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions: BigNumber = BigNumber.from(2);
      const paymentValue: BigNumber = ptPaymentsValueThreshold;

      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions.toNumber(),
        referee,
        referrer,
        proxyContract,
        paymentValue: paymentValue,
      });
      const expectedError: string = REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED;
      // await another referral process transaction after the referral has been completed
      const referralTxPromise = proxyContract
        .connect(referee)
        .registerReferralPayment(referrer.address, {
          value: paymentValue,
        });
      // await calls to be rejected since referral has been completed
      await expect(referralTxPromise).to.be.rejectedWith(expectedError);
    });

    it(`${CONTRACT_NAME} should allocate the reward to the referrer and make it claimable if referral process is completed`, async () => {
      const { referrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialBalance: BigNumber = await referrer.getBalance();
      // number of payments in order for the referral process to be completed
      const numberOfPaymentTransactions: BigNumber = BigNumber.from(2);
      const paymentValue: BigNumber = ptPaymentsValueThreshold;
      // complete referral process
      await executeReferralPayment({
        executions: numberOfPaymentTransactions.toNumber(),
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
        paymentValue.mul(numberOfPaymentTransactions)
      );
      expect(referralProcessMapping.paymentsQuantity).to.equal(
        numberOfPaymentTransactions
      );

      // calculate reward values
      const expectedPaidOutReward: BigNumber = paymentValue
        .mul(ptRewardPercentage)
        .div(100)
        .mul(numberOfPaymentTransactions);

      // assert correct reward amount is claimable for referrer
      const claimableReferrerReward: BigNumber =
        await proxyContract.claimableRewardMapping(referrer.address);
      expect(claimableReferrerReward).to.be.closeTo(
        expectedPaidOutReward,
        TEST_PRECISION_DELTA
      );

      // claim rewards with referrer
      const claimReferrerRewardTx: ContractTransaction = await proxyContract
        .connect(referrer)
        .claimRewards();

      const txCost: BigNumber = await getTransactionCosts(
        claimReferrerRewardTx
      );

      // calculate result values
      const afterReferrerBalance: BigNumber = await referrer.getBalance();
      const contractBalance: BigNumber = await proxyContract.getBalance();

      // initial balance + claimed reward - claim tx cost
      const referrerResult: BigNumber = initialBalance
        .add(expectedPaidOutReward)
        .sub(txCost);

      // assert reward has been paid out after completion
      expect(afterReferrerBalance).to.be.closeTo(
        referrerResult,
        TEST_PRECISION_DELTA
      );
      expect(contractBalance).to.be.closeTo(0, TEST_PRECISION_DELTA);
    });

    it(`${CONTRACT_NAME} should throw if no rewards are available to claim`, async () => {
      const { referee, proxyContract } = await loadFixture(defaultFixture);

      const claimTxPromise: Promise<ContractTransaction> = proxyContract
        .connect(referee)
        .claimRewards();

      await expect(claimTxPromise).to.be.rejectedWith(NO_REWARDS_TO_CLAIM);
    });
  });
});
