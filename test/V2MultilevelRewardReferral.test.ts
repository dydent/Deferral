import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REFERRER_IS_NOT_REGISTERED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
  ROOT_ADDRESS_CANNOT_BE_REFEREE,
  SENDER_CANNOT_BE_REFERRER,
} from "../helpers/constants/error-strings";
import { deployV2MultilevelReferralRewardFixture } from "../helpers/test-helpers/multilevel-reward-referral-fixtures";
import { ethers } from "hardhat";
import { createReferralChain } from "../helpers/test-helpers/create-referral-chain";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const MULTILEVEL_REWARDS_CONTRACT = "V2MultilevelRewardReferralUpgradable";
// must be between 0 and 100!
const REFERRAL_PERCENTAGE = 30;
// must be between 0 and 100!
const REFEREE_REWARD_ALLOCATION_PERCENTAGE = 50;
// number of payment transactions for a referral process to be complete = thresholds + 1
const QUANTITY_THRESHOLD = 1;
const VALUE_THRESHOLD = 1;

// noinspection DuplicatedCode
describe(`"Testing ${MULTILEVEL_REWARDS_CONTRACT} referral contract`, async () => {
  // get fixture function for testing
  const deployUpgradableFixture = async () => {
    return deployV2MultilevelReferralRewardFixture({
      contractName: MULTILEVEL_REWARDS_CONTRACT,
      referralPercentage: REFERRAL_PERCENTAGE,
      refereeRewardAllocationPercentage: REFEREE_REWARD_ALLOCATION_PERCENTAGE,
      paymentQuantityThreshold: QUANTITY_THRESHOLD,
      paymentValueThreshold: VALUE_THRESHOLD,
    });
  };

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Updating Contract Values`, async () => {
    it(`${MULTILEVEL_REWARDS_CONTRACT} should update receiver address`, async () => {
      const { admin, updatedReceiver, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // assert address are not the same at the start
      const initialAddress = await proxyContract.receiverAddress();
      const updateAddress = await updatedReceiver.getAddress();
      expect(initialAddress).to.not.equal(updateAddress);
      // update receiver address
      await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
      const contractReceiverAddress = await proxyContract.receiverAddress();
      // assert address is updated
      expect(updateAddress).to.equal(contractReceiverAddress);
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 20, 100];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateReferralReward(updatedValue);
        const contractValue = await proxyContract.rewardPercentage();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with invalid and outbound boundary values
      const invalidUpdateValues = [101, 500];
      // update values and assert update fails
      for (const updatedValue of invalidUpdateValues) {
        const referralRewardUpdatePromise = proxyContract
          .connect(admin)
          .updateReferralReward(updatedValue);
        await expect(referralRewardUpdatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should update referee reward allocation percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 20, 100];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updateRefereeRewardAllocation(updatedValue);
        const contractValue =
          await proxyContract.refereeRewardAllocationPercentage();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if updated referee reward allocation percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with invalid and outbound boundary values
      const invalidUpdateValues = [101, 500];
      // update values and assert update fails
      for (const updatedValue of invalidUpdateValues) {
        const updatePromise = proxyContract
          .connect(admin)
          .updateRefereeRewardAllocation(updatedValue);
        await expect(updatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should update payments quantity threshold`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 6, 10];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updatePaymentsQuantityThreshold(updatedValue);
        const contractValue = await proxyContract.paymentsQuantityThreshold();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should update payments value threshold`, async () => {
      const { admin, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 50, 100];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract
          .connect(admin)
          .updatePaymentsValueThreshold(updatedValue);
        const contractValue = await proxyContract.paymentsValueThreshold();
        expect(contractValue).to.equal(updatedValue);
      }
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Unit tests for function modifiers and conditions
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Function Modifiers`, async () => {
    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if non-admin tries to update contract`, async () => {
      const { rootReferrer, updatedReceiver, proxyContract } =
        await loadFixture(deployUpgradableFixture);
      const nonAdminSigner = rootReferrer;
      const validReferralReward = ethConverter(3);
      const validReceiverAddress = await updatedReceiver.getAddress();
      const validPaymentQuantity = 9;
      const validPaymentsValue = 105;
      const expectedError = OWNABLE_ERROR_STRING;

      // execute tx with valid values and non-admin signer
      const referralRewardUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReferralReward(validReferralReward);
      const receiverAddressUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updateReceiverAddress(validReceiverAddress);
      const paymentsQuantityUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updatePaymentsQuantityThreshold(validPaymentQuantity);
      const paymentsValueUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updatePaymentsQuantityThreshold(validPaymentsValue);
      // await tx calls to be rejected since they are not owner of the contract
      await expect(referralRewardUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(paymentsQuantityUpdatePromise).to.be.rejectedWith(
        expectedError
      );
      await expect(paymentsValueUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Function Testing
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Registering & Forwarding Payment Functionality`, async () => {
    const paymentsValueThreshold = 100;
    const paymentsQuantityThreshold = 5;
    const paymentValue = 10;

    // get fixture function for testing
    const deployFunctionTestingFixture = async () => {
      return deployV2MultilevelReferralRewardFixture({
        contractName: MULTILEVEL_REWARDS_CONTRACT,
        referralPercentage: REFERRAL_PERCENTAGE,
        refereeRewardAllocationPercentage: REFEREE_REWARD_ALLOCATION_PERCENTAGE,
        paymentQuantityThreshold: paymentsQuantityThreshold,
        paymentValueThreshold: paymentsValueThreshold,
      });
    };
    it(`${MULTILEVEL_REWARDS_CONTRACT} should register payment of new address with no referrer as root referrer`, async () => {
      const { rootReferrer, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );

      // execute root referrer payment with no referrer param --> registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      const rootReferrerMapping = await proxyContract.refereeProcessMapping(
        rootReferrer.address
      );
      // assert root referrer data is updated and registered correctly
      expect(rootReferrerMapping.isRoot).to.equal(true);
      expect(rootReferrerMapping.referralProcessCompleted).to.equal(false);
      expect(rootReferrerMapping.referrerAddressHasBeenSet).to.equal(false);
      expect(rootReferrerMapping.parentReferrerAddress).to.equal(
        ethers.constants.AddressZero
      );
      expect(rootReferrerMapping.paymentsValue).to.equal(
        ethConverter(paymentValue).toBigInt()
      );
      expect(rootReferrerMapping.paymentsQuantity).to.equal(1);
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should register payment of registered referee with empty referrer param correctly`, async () => {
      const { rootReferrer, referee, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });
      const refereeProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(refereeProcessMapping.referralProcessCompleted).to.equal(false);
      expect(refereeProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(refereeProcessMapping.parentReferrerAddress).to.equal(
        rootReferrer.address
      );
      expect(refereeProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue).toBigInt()
      );
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register another referee payment with empty referral address param
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });
      const updatedRefereeProcessMapping =
        await proxyContract.refereeProcessMapping(referee.address);
      // assert data is updated correctly
      expect(updatedRefereeProcessMapping.referralProcessCompleted).to.equal(
        false
      );
      expect(updatedRefereeProcessMapping.referrerAddressHasBeenSet).to.equal(
        true
      );
      expect(updatedRefereeProcessMapping.parentReferrerAddress).to.equal(
        rootReferrer.address
      );
      expect(updatedRefereeProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue * 2).toBigInt()
      );
      expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should register payment of registered referee with different registered referrer correctly (referrer address cannot be changed)`, async () => {
      const { rootReferrer, rootReferrer2, referee, proxyContract } =
        await loadFixture(deployFunctionTestingFixture);
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      await proxyContract
        .connect(rootReferrer2)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });
      const refereeProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(refereeProcessMapping.referralProcessCompleted).to.equal(false);
      expect(refereeProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(refereeProcessMapping.parentReferrerAddress).to.equal(
        rootReferrer.address
      );
      expect(refereeProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue).toBigInt()
      );
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register another referee payment with different registered referral address param
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer2.address, {
          value: ethConverter(paymentValue),
        });
      const updatedRefereeProcessMapping =
        await proxyContract.refereeProcessMapping(referee.address);
      // assert data is updated correctly
      expect(updatedRefereeProcessMapping.referralProcessCompleted).to.equal(
        false
      );
      expect(updatedRefereeProcessMapping.referrerAddressHasBeenSet).to.equal(
        true
      );
      expect(updatedRefereeProcessMapping.parentReferrerAddress).to.equal(
        rootReferrer.address
      );
      expect(updatedRefereeProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue * 2).toBigInt()
      );
      expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should register payment of referee with higher level referee and update data correctly`, async () => {
      const { rootReferrer, referee, referee2, proxyContract } =
        await loadFixture(deployFunctionTestingFixture);
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });
      const refereeProcessMapping = await proxyContract.refereeProcessMapping(
        referee.address
      );
      // assert data is updated correctly
      expect(refereeProcessMapping.referralProcessCompleted).to.equal(false);
      expect(refereeProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(refereeProcessMapping.parentReferrerAddress).to.equal(
        rootReferrer.address
      );
      expect(refereeProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue).toBigInt()
      );
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register new referee with higher level referee as referrer
      await proxyContract
        .connect(referee2)
        ["registerReferralPayment(address)"](referee.address, {
          value: ethConverter(paymentValue),
        });
      const referee2ProcessMapping = await proxyContract.refereeProcessMapping(
        referee2.address
      );
      // assert data is updated correctly
      expect(referee2ProcessMapping.referralProcessCompleted).to.equal(false);
      expect(referee2ProcessMapping.referrerAddressHasBeenSet).to.equal(true);
      expect(referee2ProcessMapping.parentReferrerAddress).to.equal(
        referee.address
      );
      expect(referee2ProcessMapping.paymentsValue).to.equal(
        ethConverter(paymentValue).toBigInt()
      );
      expect(referee2ProcessMapping.paymentsQuantity).to.equal(1);
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if referee uses its own address as referrer`, async () => {
      const { referee, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );

      // register referee with root referrer as referee
      const refereePaymentTxPromise = proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](referee.address, {
          value: ethConverter(paymentValue),
        });

      // await calls to be rejected since referral has been completed
      await expect(refereePaymentTxPromise).to.be.rejectedWith(
        SENDER_CANNOT_BE_REFERRER
      );
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if referrer address is not registered as referee or root referrer`, async () => {
      const { rootReferrer, referee, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );
      // register root referrer

      // register referee with root referrer as referee
      const refereePaymentTxPromise = proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });

      // await calls to be rejected since referral has been completed
      await expect(refereePaymentTxPromise).to.be.rejectedWith(
        REFERRER_IS_NOT_REGISTERED
      );
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if registered root referrer tries to register as referee `, async () => {
      const { rootReferrer, rootReferrer2, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );

      // register root referrers
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      await proxyContract
        .connect(rootReferrer2)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });

      // try register root referrer with other referrer address
      const rootAsRefereePaymentTx = proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment(address)"](rootReferrer2.address, {
          value: ethConverter(paymentValue),
        });

      // await calls to be rejected since referral has been completed
      await expect(rootAsRefereePaymentTx).to.be.rejectedWith(
        ROOT_ADDRESS_CANNOT_BE_REFEREE
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should forward root referrer payment correctly`, async () => {
      const { receiver, rootReferrer, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );
      const initialRootReferrerBalance = await rootReferrer.getBalance();
      const initialReceiverBalance = await receiver.getBalance();

      // root referrer payment registers address as root
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      // calculate referral transaction costs
      const txReceipt = await rootReferrerPaymentTx.wait();
      const txGasUsed = await txReceipt.gasUsed;
      const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      const txCost = txGasUsed.mul(txEffectiveGasPrice);

      // calculate result values

      const finalContractBalance = await proxyContract.getBalance();
      const afterReceiverBalance = await receiver.getBalance();
      const afterRootReferrerBalance = await rootReferrer.getBalance();
      // assert balances are correct
      expect(afterReceiverBalance.toBigInt()).to.equal(
        initialReceiverBalance.toBigInt() +
          ethConverter(paymentValue).toBigInt()
      );
      expect(afterRootReferrerBalance.toBigInt()).to.equal(
        initialRootReferrerBalance.toBigInt() -
          ethConverter(paymentValue).toBigInt() -
          txCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        ethConverter(0).toBigInt()
      );
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should forward multiple root referrer payments and update data correctly`, async () => {
      const { receiver, rootReferrer, proxyContract } = await loadFixture(
        deployFunctionTestingFixture
      );

      // register root referrer with payment
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });

      const initialRootReferrerBalance = await rootReferrer.getBalance();
      const initialReceiverBalance = await receiver.getBalance();

      // second root referrer payment
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });
      // calculate referral transaction costs
      const txReceipt = await rootReferrerPaymentTx.wait();
      const txGasUsed = await txReceipt.gasUsed;
      const txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      const txCost = txGasUsed.mul(txEffectiveGasPrice);

      // calculate result values
      const rootReferrerMapping = await proxyContract.refereeProcessMapping(
        rootReferrer.address
      );
      const finalContractBalance = await proxyContract.getBalance();
      const afterReceiverBalance = await receiver.getBalance();
      const afterRootReferrerBalance = await rootReferrer.getBalance();
      // assert balances are correct
      expect(afterReceiverBalance.toBigInt()).to.equal(
        initialReceiverBalance.toBigInt() +
          ethConverter(paymentValue).toBigInt()
      );
      expect(afterRootReferrerBalance.toBigInt()).to.equal(
        initialRootReferrerBalance.toBigInt() -
          ethConverter(paymentValue).toBigInt() -
          txCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        ethConverter(0).toBigInt()
      );

      // assert root referrer data is updated and registered correctly
      expect(rootReferrerMapping.isRoot).to.equal(true);
      expect(rootReferrerMapping.referralProcessCompleted).to.equal(false);
      expect(rootReferrerMapping.referrerAddressHasBeenSet).to.equal(false);
      expect(rootReferrerMapping.parentReferrerAddress).to.equal(
        ethers.constants.AddressZero
      );
      expect(rootReferrerMapping.paymentsValue).to.equal(
        ethConverter(paymentValue * 2).toBigInt()
      );
      expect(rootReferrerMapping.paymentsQuantity).to.equal(2);
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should forward referee payment with referrer address param correctly`, async () => {
      const { receiver, referee, rootReferrer, proxyContract } =
        await loadFixture(deployFunctionTestingFixture);

      // root referrer payment registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });

      const initialRefereeBalance = await referee.getBalance();
      const initialReceiverBalance = await receiver.getBalance();
      const initialContractValue = await proxyContract.getBalance();

      // execute referee payment with root referrer as referrer address
      const refereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });

      // calculate referral transaction costs
      const refereeTxReceipt = await refereePaymentTx.wait();
      const refereeTxGasUsed = await refereeTxReceipt.gasUsed;
      const refereeTxEffectiveGasPrice =
        await refereeTxReceipt.effectiveGasPrice;
      const refereeTxCost = refereeTxGasUsed.mul(refereeTxEffectiveGasPrice);

      // calculate result values
      const reward = (paymentValue / 100) * REFERRAL_PERCENTAGE;
      const receiverAmount = paymentValue - reward;
      const finalContractBalance = await proxyContract.getBalance();
      const afterReceiverBalance = await receiver.getBalance();
      const afterRefereeBalance = await referee.getBalance();
      // assert balances are correct
      expect(afterReceiverBalance.toBigInt()).to.equal(
        initialReceiverBalance.toBigInt() +
          ethConverter(receiverAmount).toBigInt()
      );
      expect(afterRefereeBalance.toBigInt()).to.equal(
        initialRefereeBalance.toBigInt() -
          ethConverter(paymentValue).toBigInt() -
          refereeTxCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        initialContractValue.toBigInt() + ethConverter(reward).toBigInt()
      );
    });
    it(`${MULTILEVEL_REWARDS_CONTRACT} should forward referee payment with empty referrer address param correctly`, async () => {
      const { receiver, referee, rootReferrer, proxyContract } =
        await loadFixture(deployFunctionTestingFixture);

      // root referrer payment registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });

      // execute referee payment with root referrer as referrer address
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });

      const initialRefereeBalance = await referee.getBalance();
      const initialReceiverBalance = await receiver.getBalance();
      const initialContractValue = await proxyContract.getBalance();

      // execute referee payment with empty address param
      const refereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate referral transaction costs
      const refereeTxReceipt = await refereePaymentTx.wait();
      const refereeTxGasUsed = await refereeTxReceipt.gasUsed;
      const refereeTxEffectiveGasPrice =
        await refereeTxReceipt.effectiveGasPrice;
      const refereeTxCost = refereeTxGasUsed.mul(refereeTxEffectiveGasPrice);

      // calculate result values
      const reward = (paymentValue / 100) * REFERRAL_PERCENTAGE;
      const receiverAmount = paymentValue - reward;
      const finalContractBalance = await proxyContract.getBalance();
      const afterReceiverBalance = await receiver.getBalance();
      const afterRefereeBalance = await referee.getBalance();
      // assert balances are correct
      expect(afterReceiverBalance.toBigInt()).to.equal(
        initialReceiverBalance.toBigInt() +
          ethConverter(receiverAmount).toBigInt()
      );
      expect(afterRefereeBalance.toBigInt()).to.equal(
        initialRefereeBalance.toBigInt() -
          ethConverter(paymentValue).toBigInt() -
          refereeTxCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        initialContractValue.toBigInt() + ethConverter(reward).toBigInt()
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Distributing Referral Rewards
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Distributing Multi Level Rewards Functionality`, async () => {
    // light referral conditions for easier testing --> second transaction will complete referral process
    const paymentValue = 10;
    const paymentsValueThreshold = paymentValue;
    const paymentsQuantityThreshold = 1;

    // get fixture function for testing
    const deployReferralRewardsPayoutFixture = async () => {
      return deployV2MultilevelReferralRewardFixture({
        contractName: MULTILEVEL_REWARDS_CONTRACT,
        referralPercentage: REFERRAL_PERCENTAGE,
        refereeRewardAllocationPercentage: REFEREE_REWARD_ALLOCATION_PERCENTAGE,

        paymentQuantityThreshold: paymentsQuantityThreshold,
        paymentValueThreshold: paymentsValueThreshold,
      });
    };

    // -----------------------------------------------------------------------------------------------
    // Testing Referral Completion and Reward Payments
    // -----------------------------------------------------------------------------------------------

    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute 1-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);
      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for referee 1
      await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate result values
      const numberOfRewardLevels = 1;
      const registeredPaidValue = paymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (paymentValue / 100) * REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * REFERRAL_PERCENTAGE;
      const expectedPaidOutRewardProportion =
        expectedPaidOutReward / numberOfRewardLevels;

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // contract --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedPaidOutReward).toBigInt()
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute 2-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for referee 2
      await chain.proxyContract
        .connect(chain.referee2)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate result values
      const numberOfRewardLevels = 2;
      const registeredPaidValue = paymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (paymentValue / 100) * REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * REFERRAL_PERCENTAGE;
      const expectedPaidOutRewardProportion =
        expectedPaidOutReward / numberOfRewardLevels;

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // contract --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedPaidOutReward).toBigInt()
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute 3-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for referee 3
      await chain.proxyContract
        .connect(chain.referee3)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate result values
      const numberOfRewardLevels = 3;
      const registeredPaidValue = paymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (paymentValue / 100) * REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterReferee2Balance = await chain.referee2.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * REFERRAL_PERCENTAGE;
      const expectedPaidOutRewardProportion =
        expectedPaidOutReward / numberOfRewardLevels;

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee 2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // contract --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedPaidOutReward).toBigInt()
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute 4-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for referee 4
      await chain.proxyContract
        .connect(chain.referee4)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate result values
      const numberOfRewardLevels = 4;
      const registeredPaidValue = paymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (paymentValue / 100) * REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterReferee2Balance = await chain.referee2.getBalance();
      const afterReferee3Balance = await chain.referee3.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * REFERRAL_PERCENTAGE;
      const expectedPaidOutRewardProportion =
        expectedPaidOutReward / numberOfRewardLevels;

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee 2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee 3
      expect(afterReferee3Balance.toBigInt()).to.equal(
        chain.initialReferee3Balance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // contract --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedPaidOutReward).toBigInt()
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute 5-level (final referee) rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for final referee (5)
      await chain.proxyContract
        .connect(chain.finalReferee)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate result values
      const numberOfRewardLevels = 5;
      const registeredPaidValue = paymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (paymentValue / 100) * REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterReferee2Balance = await chain.referee2.getBalance();
      const afterReferee3Balance = await chain.referee3.getBalance();
      const afterReferee4Balance = await chain.referee4.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * REFERRAL_PERCENTAGE;
      const expectedPaidOutRewardProportion =
        expectedPaidOutReward / numberOfRewardLevels;

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee 2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee 3
      expect(afterReferee3Balance.toBigInt()).to.equal(
        chain.initialReferee3Balance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // referee 4
      expect(afterReferee4Balance.toBigInt()).to.equal(
        chain.initialReferee4Balance.toBigInt() +
          ethConverter(expectedPaidOutRewardProportion).toBigInt()
      );
      // contract --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedPaidOutReward).toBigInt()
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute multiple (1-level & 2-level) rewards correctly after referees completed referral processes`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for referee 1
      await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      const initialAfterCompletionPaymentRefereeBalance =
        await chain.referee.getBalance();

      // complete referral process for referee 2
      await chain.proxyContract
        .connect(chain.referee2)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // calculate result values
      const registeredPaidValue = paymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (paymentValue / 100) * REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * REFERRAL_PERCENTAGE;

      const firstLevelRewardProportion = expectedPaidOutReward;
      const secondLevelRewardProportion = expectedPaidOutReward / 2;

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer receives 2x rewards since both referee1 and referee2 have completed process
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(
            firstLevelRewardProportion + secondLevelRewardProportion
          ).toBigInt()
      );
      // referee should receive rewards also if they have completed the process
      expect(afterRefereeBalance.toBigInt()).to.equal(
        initialAfterCompletionPaymentRefereeBalance.toBigInt() +
          ethConverter(secondLevelRewardProportion).toBigInt()
      );
      // contract --> initial contract balance + 2x completion payment reward amount that was received -  2x distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward * 2).toBigInt() -
          ethConverter(expectedPaidOutReward * 2).toBigInt()
      );
    });

    it(`${MULTILEVEL_REWARDS_CONTRACT} should throw if referee with completed process wants to register payment`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(deployReferralRewardsPayoutFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue,
      });

      // complete referral process for referee 1
      await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      const completedRefereePaymentTxPromise = chain.proxyContract
        .connect(referee)
        ["registerReferralPayment()"]({
          value: ethConverter(paymentValue),
        });

      // await calls to be rejected since referral has been completed
      await expect(completedRefereePaymentTxPromise).to.be.rejectedWith(
        REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED
      );
    });
  });
});
