import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../../helpers/converters";
import { expect } from "chai";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REFERRER_IS_NOT_REGISTERED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
  ROOT_ADDRESS_CANNOT_BE_REFEREE,
  SENDER_CANNOT_BE_REFERRER,
} from "../../helpers/constants/error-strings";
import { deployV2MultilevelReferralRewardFixture } from "../../helpers/test-helpers/multilevel-reward-referral-fixtures";
import { ethers, upgrades } from "hardhat";
import { createReferralChain } from "../../helpers/test-helpers/create-referral-chain";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";

// TODO try to fix this
// -----------------------------------------------------------------------------------------------
// NOTE: Depending on the values that are used for testing there can be rounding errors and failing test cases
// -----------------------------------------------------------------------------------------------

const CONTRACT_NAME = "V2ReferralMultilevelRewardsUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

// must be between 0 and 100!
const DEFAULT_REFERRAL_PERCENTAGE = 30;
const DEFAULT_REFEREE_PERCENTAGE = 40;
// number of payment transactions for a referral process to be complete = thresholds + 1
const DEFAULT_QUANTITY_THRESHOLD = 1;
const DEFAULT_VALUE_THRESHOLD = 1;
const DEFAULT_MAX_REWARD_LEVEL = 1;

// noinspection DuplicatedCode
describe(`Testing ${CONTRACT_NAME} Referral Contract`, async () => {
  // get fixture function for testing
  const defaultFixture = async () => {
    return deployV2MultilevelReferralRewardFixture({
      contractName: CONTRACT_NAME,
      referralPercentage: DEFAULT_REFERRAL_PERCENTAGE,
      refereePercentage: DEFAULT_REFEREE_PERCENTAGE,
      paymentQuantityThreshold: DEFAULT_QUANTITY_THRESHOLD,
      paymentValueThreshold: DEFAULT_VALUE_THRESHOLD,
      maxRewardLevels: DEFAULT_MAX_REWARD_LEVEL,
    });
  };

  // -----------------------------------------------------------------------------------------------
  // Testing Contract Deployment
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Contract Deployment`, async () => {
    it(`${CONTRACT_NAME} should throw if deployed with incorrect referral reward param`, async () => {
      const [receiver] = await ethers.getSigners();

      const incorrectRewardPercentage = 105;
      const correctRewardPercentage = 60;

      const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

      const deployedProxyContractPromise = upgrades.deployProxy(
        referralContract,
        [
          receiver.address,
          correctRewardPercentage,
          incorrectRewardPercentage,
          DEFAULT_QUANTITY_THRESHOLD,
          DEFAULT_VALUE_THRESHOLD,
          DEFAULT_MAX_REWARD_LEVEL,
        ]
      );
      await expect(deployedProxyContractPromise).to.be.rejectedWith(
        REWARD_PERCENTAGE_OUT_OF_BOUNDS
      );
    });

    it(`${CONTRACT_NAME} should throw if deployed with incorrect referee reward param`, async () => {
      const [receiver] = await ethers.getSigners();

      const incorrectRewardPercentage = 105;
      const correctRewardPercentage = 50;

      const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

      const deployedProxyContractPromise = upgrades.deployProxy(
        referralContract,
        [
          receiver.address,
          incorrectRewardPercentage,
          correctRewardPercentage,
          DEFAULT_QUANTITY_THRESHOLD,
          DEFAULT_VALUE_THRESHOLD,
          DEFAULT_MAX_REWARD_LEVEL,
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
    it(`${CONTRACT_NAME} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 20, 100];
      // update values and assert they are updated
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

    it(`${CONTRACT_NAME} should update referee reward  percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 20, 100];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateRefereeReward(updatedValue);
        const contractValue = await proxyContract.refereeRewardPercentage();
        expect(contractValue).to.equal(updatedValue);
      }
    });
    it(`${CONTRACT_NAME} should throw if updated referee reward  percentage is not between 0 and 100`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with invalid and outbound boundary values
      const invalidUpdateValues = [101, 500];
      // update values and assert update fails
      for (const updatedValue of invalidUpdateValues) {
        const updatePromise = proxyContract
          .connect(admin)
          .updateRefereeReward(updatedValue);
        await expect(updatePromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      }
    });

    it(`${CONTRACT_NAME} should update payments quantity threshold`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
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
    it(`${CONTRACT_NAME} should update payments value threshold`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
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
    it(`${CONTRACT_NAME} should update max reward levels`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues = [0, 4, 20];
      // update values and assert they are updated
      for (const updatedValue of validUpdateValues) {
        await proxyContract.connect(admin).updateMaxRewardLevels(updatedValue);
        const contractValue = await proxyContract.maxRewardLevels();
        expect(contractValue).to.equal(updatedValue);
      }
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Function Modifiers
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Function Modifiers`, async () => {
    it(`${CONTRACT_NAME} should throw if non-admin tries to update contract`, async () => {
      const { rootReferrer, updatedReceiver, proxyContract } =
        await loadFixture(defaultFixture);
      const nonAdminSigner = rootReferrer;
      const validReferralReward = ethConverter(3);
      const validReceiverAddress = await updatedReceiver.getAddress();
      const validPaymentQuantity = 9;
      const validPaymentsValue = 105;
      const validMaxRewardLevels = 20;
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
      const maxRewardLevelsUpdatePromise = proxyContract
        .connect(nonAdminSigner)
        .updatePaymentsQuantityThreshold(validMaxRewardLevels);
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
      await expect(maxRewardLevelsUpdatePromise).to.be.rejectedWith(
        expectedError
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Referral Process Functionality
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process Functionality`, async () => {
    const ptPaymentsValueThreshold = 100;
    const ptPaymentsQuantityThreshold = 5;
    const ptMaxRewardLevels = 2;
    const ptPaymentAmount = 10;

    // get fixture function for testing
    const processTestingFixture = async () => {
      return deployV2MultilevelReferralRewardFixture({
        contractName: CONTRACT_NAME,
        referralPercentage: DEFAULT_REFERRAL_PERCENTAGE,
        refereePercentage: DEFAULT_REFEREE_PERCENTAGE,
        paymentQuantityThreshold: ptPaymentsQuantityThreshold,
        paymentValueThreshold: ptPaymentsValueThreshold,
        maxRewardLevels: ptMaxRewardLevels,
      });
    };

    it(`${CONTRACT_NAME} should throw if sender/referee is referrer`, async () => {
      const { referee, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // register referee with root referrer as referee
      const refereePaymentTxPromise = proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](referee.address, {
          value: ethConverter(ptPaymentAmount),
        });

      // await calls to be rejected since referral has been completed
      await expect(refereePaymentTxPromise).to.be.rejectedWith(
        SENDER_CANNOT_BE_REFERRER
      );
    });
    it(`${CONTRACT_NAME} should register payment of new address with no referrer as root referrer`, async () => {
      const { rootReferrer, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // execute root referrer payment with no referrer param --> registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
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
        ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(rootReferrerMapping.paymentsQuantity).to.equal(1);
    });
    it(`${CONTRACT_NAME} should register payment of registered referee with empty referrer param correctly`, async () => {
      const { rootReferrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
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
        ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register another referee payment with empty referral address param
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
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
        ethConverter(ptPaymentAmount * 2).toBigInt()
      );
      expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
    });
    it(`${CONTRACT_NAME} should register payment of registered referee with different registered referrer correctly (referrer address cannot be changed)`, async () => {
      const { rootReferrer, rootReferrer2, referee, proxyContract } =
        await loadFixture(processTestingFixture);
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
      await proxyContract
        .connect(rootReferrer2)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
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
        ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register another referee payment with different registered referral address param
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer2.address, {
          value: ethConverter(ptPaymentAmount),
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
        ethConverter(ptPaymentAmount * 2).toBigInt()
      );
      expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
    });
    it(`${CONTRACT_NAME} should register payment of referee with higher level referee and update data correctly`, async () => {
      const { rootReferrer, referee, referee2, proxyContract } =
        await loadFixture(processTestingFixture);
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
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
        ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register new referee with higher level referee as referrer
      await proxyContract
        .connect(referee2)
        ["registerReferralPayment(address)"](referee.address, {
          value: ethConverter(ptPaymentAmount),
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
        ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(referee2ProcessMapping.paymentsQuantity).to.equal(1);
    });
    it(`${CONTRACT_NAME} should throw if referrer address is not registered as referee or root referrer`, async () => {
      const { rootReferrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // register root referrer

      // register referee with root referrer as referee
      const refereePaymentTxPromise = proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
        });

      // await calls to be rejected since referral has been completed
      await expect(refereePaymentTxPromise).to.be.rejectedWith(
        REFERRER_IS_NOT_REGISTERED
      );
    });
    it(`${CONTRACT_NAME} should throw if registered root referrer tries to register as referee `, async () => {
      const { rootReferrer, rootReferrer2, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // register root referrers
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
      await proxyContract
        .connect(rootReferrer2)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });

      // try register root referrer with other referrer address
      const rootAsRefereePaymentTx = proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment(address)"](rootReferrer2.address, {
          value: ethConverter(ptPaymentAmount),
        });

      // await calls to be rejected since referral has been completed
      await expect(rootAsRefereePaymentTx).to.be.rejectedWith(
        ROOT_ADDRESS_CANNOT_BE_REFEREE
      );
    });

    it(`${CONTRACT_NAME} should forward root referrer payment correctly`, async () => {
      const { receiver, rootReferrer, proxyContract } = await loadFixture(
        processTestingFixture
      );
      const initialRootReferrerBalance = await rootReferrer.getBalance();
      const initialReceiverBalance = await receiver.getBalance();

      // root referrer payment registers address as root
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
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
          ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(afterRootReferrerBalance.toBigInt()).to.equal(
        initialRootReferrerBalance.toBigInt() -
          ethConverter(ptPaymentAmount).toBigInt() -
          txCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        ethConverter(0).toBigInt()
      );
    });
    it(`${CONTRACT_NAME} should forward multiple root referrer payments and update data correctly`, async () => {
      const { receiver, rootReferrer, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // register root referrer with payment
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });

      const initialRootReferrerBalance = await rootReferrer.getBalance();
      const initialReceiverBalance = await receiver.getBalance();

      // second root referrer payment
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });
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
          ethConverter(ptPaymentAmount).toBigInt()
      );
      expect(afterRootReferrerBalance.toBigInt()).to.equal(
        initialRootReferrerBalance.toBigInt() -
          ethConverter(ptPaymentAmount).toBigInt() -
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
        ethConverter(ptPaymentAmount * 2).toBigInt()
      );
      expect(rootReferrerMapping.paymentsQuantity).to.equal(2);
    });
    it(`${CONTRACT_NAME} should forward referee payment with referrer address param correctly`, async () => {
      const { receiver, referee, rootReferrer, proxyContract } =
        await loadFixture(processTestingFixture);

      // root referrer payment registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });

      const initialRefereeBalance = await referee.getBalance();
      const initialReceiverBalance = await receiver.getBalance();
      const initialContractValue = await proxyContract.getBalance();

      // execute referee payment with root referrer as referrer address
      const refereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
        });

      // calculate referral transaction costs
      const refereeTxReceipt = await refereePaymentTx.wait();
      const refereeTxGasUsed = await refereeTxReceipt.gasUsed;
      const refereeTxEffectiveGasPrice =
        await refereeTxReceipt.effectiveGasPrice;
      const refereeTxCost = refereeTxGasUsed.mul(refereeTxEffectiveGasPrice);

      // calculate result values
      const reward = (ptPaymentAmount / 100) * DEFAULT_REFERRAL_PERCENTAGE;
      const receiverAmount = ptPaymentAmount - reward;
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
          ethConverter(ptPaymentAmount).toBigInt() -
          refereeTxCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        initialContractValue.toBigInt() + ethConverter(reward).toBigInt()
      );
    });
    it(`${CONTRACT_NAME} should forward referee payment with empty referrer address param correctly`, async () => {
      const { receiver, referee, rootReferrer, proxyContract } =
        await loadFixture(processTestingFixture);

      // root referrer payment registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(ptPaymentAmount) });

      // execute referee payment with root referrer as referrer address
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(ptPaymentAmount),
        });

      const initialRefereeBalance = await referee.getBalance();
      const initialReceiverBalance = await receiver.getBalance();
      const initialContractValue = await proxyContract.getBalance();

      // execute referee payment with empty address param
      const refereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment()"]({
          value: ethConverter(ptPaymentAmount),
        });

      // calculate referral transaction costs
      const refereeTxReceipt = await refereePaymentTx.wait();
      const refereeTxGasUsed = await refereeTxReceipt.gasUsed;
      const refereeTxEffectiveGasPrice =
        await refereeTxReceipt.effectiveGasPrice;
      const refereeTxCost = refereeTxGasUsed.mul(refereeTxEffectiveGasPrice);

      // calculate result values
      const reward = (ptPaymentAmount / 100) * DEFAULT_REFERRAL_PERCENTAGE;
      const receiverAmount = ptPaymentAmount - reward;
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
          ethConverter(ptPaymentAmount).toBigInt() -
          refereeTxCost.toBigInt()
      );
      expect(finalContractBalance.toBigInt()).to.equal(
        initialContractValue.toBigInt() + ethConverter(reward).toBigInt()
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Distributing Two-Sided Multilevel Referral Rewards with MaxRewardLevels
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Distributing Two-Sided Multi Level Rewards Functionality`, async () => {
    // referral conditions for testing reward distribution (rd)
    const rdPaymentValue = 12;
    const rdReferralPercentage = 20;
    const rdRefereePercentage = 40;
    const rdPaymentsValueThreshold = rdPaymentValue;
    const rdPaymentsQuantityThreshold = 1;
    const rdMaxRewardLevel = 3;

    // get fixture function for testing
    const rewardDistributionFixture = async () => {
      return deployV2MultilevelReferralRewardFixture({
        contractName: CONTRACT_NAME,
        referralPercentage: rdReferralPercentage,
        refereePercentage: rdRefereePercentage,
        paymentQuantityThreshold: rdPaymentsQuantityThreshold,
        paymentValueThreshold: rdPaymentsValueThreshold,
        maxRewardLevels: rdMaxRewardLevel,
      });
    };

    // -----------------------------------------------------------------------------------------------
    // Testing Referral Completion and Reward Payments
    // -----------------------------------------------------------------------------------------------

    it(`${CONTRACT_NAME} should distribute 1-level two-sided rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 1
      const completionPayment = await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const txCost = await getTransactionCosts(completionPayment);

      // calculate result values
      const numberOfRewardLevels = 1;
      const registeredPaidValue = rdPaymentValue * 2;

      const referrerPercentage = 100 - rdRefereePercentage;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * rdReferralPercentage;
      // account balances
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward =
        (registeredPaidValue / 100) * rdReferralPercentage;
      // reward for referee
      const expectedRefereeReward =
        (expectedTotalPaidOutReward / 100) * rdRefereePercentage;
      // reward for all referrers
      const expectedReferrerReward =
        (expectedTotalPaidOutReward / 100) * referrerPercentage;
      // reward for a single referrer
      const expectedRefereeRewardProportion =
        expectedReferrerReward / numberOfRewardLevels;

      // assert two-sided rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFEREE --> referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() -
          ethConverter(rdPaymentValue).toBigInt() -
          txCost.toBigInt() +
          ethConverter(expectedRefereeReward).toBigInt()
      );

      // REFERRERS

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedTotalPaidOutReward).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should distribute 2-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 2
      const completionPayment = await chain.proxyContract
        .connect(chain.referee2)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const txCost = await getTransactionCosts(completionPayment);

      // calculate result values
      const numberOfRewardLevels = 2;
      const registeredPaidValue = rdPaymentValue * 2;

      const referrerPercentage = 100 - rdRefereePercentage;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * rdReferralPercentage;
      // account balances
      const afterReferee2Balance = await chain.referee2.getBalance();
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward =
        (registeredPaidValue / 100) * rdReferralPercentage;
      // reward for referee
      const expectedRefereeReward =
        (expectedTotalPaidOutReward / 100) * rdRefereePercentage;
      // reward for all referrers
      const expectedReferrerReward =
        (expectedTotalPaidOutReward / 100) * referrerPercentage;
      // reward for a single referrer
      const expectedRefereeRewardProportion =
        expectedReferrerReward / numberOfRewardLevels;

      // assert two-sided rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFEREE --> referee2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() -
          ethConverter(rdPaymentValue).toBigInt() -
          txCost.toBigInt() +
          ethConverter(expectedRefereeReward).toBigInt()
      );

      // REFERRERS

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedTotalPaidOutReward).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should distribute 3-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 3
      const completionPayment = await chain.proxyContract
        .connect(chain.referee3)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const txCost = await getTransactionCosts(completionPayment);

      // calculate result values
      const numberOfRewardLevels = 3;
      const registeredPaidValue = rdPaymentValue * 2;

      const referrerPercentage = 100 - rdRefereePercentage;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * rdReferralPercentage;
      // account balances
      const afterReferee3Balance = await chain.referee3.getBalance();
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterReferee2Balance = await chain.referee2.getBalance();

      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward =
        (registeredPaidValue / 100) * rdReferralPercentage;
      // reward for referee
      const expectedRefereeReward =
        (expectedTotalPaidOutReward / 100) * rdRefereePercentage;
      // reward for all referrers
      const expectedReferrerReward =
        (expectedTotalPaidOutReward / 100) * referrerPercentage;
      // reward for a single referrer
      const expectedRefereeRewardProportion =
        expectedReferrerReward / numberOfRewardLevels;

      // assert two-sided rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFEREE --> referee3
      expect(afterReferee3Balance.toBigInt()).to.equal(
        chain.initialReferee3Balance.toBigInt() -
          ethConverter(rdPaymentValue).toBigInt() -
          txCost.toBigInt() +
          ethConverter(expectedRefereeReward).toBigInt()
      );

      // REFERRERS

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedTotalPaidOutReward).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should distribute 4-level rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 4
      const completionPayment = await chain.proxyContract
        .connect(chain.referee4)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const txCost = await getTransactionCosts(completionPayment);

      // calculate result values
      // still 3 since rdMaxRewardLevel is 3 as well!!!
      const numberOfRewardLevels = 3;
      const registeredPaidValue = rdPaymentValue * 2;

      const referrerPercentage = 100 - rdRefereePercentage;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * rdReferralPercentage;
      // account balances
      const afterReferee4Balance = await chain.referee4.getBalance();
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterReferee2Balance = await chain.referee2.getBalance();
      const afterReferee3Balance = await chain.referee3.getBalance();

      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward =
        (registeredPaidValue / 100) * rdReferralPercentage;
      // reward for referee
      const expectedRefereeReward =
        (expectedTotalPaidOutReward / 100) * rdRefereePercentage;
      // reward for all referrers
      const expectedReferrerReward =
        (expectedTotalPaidOutReward / 100) * referrerPercentage;
      // reward for a single referrer
      const expectedRefereeRewardProportion =
        expectedReferrerReward / numberOfRewardLevels;

      // assert two-sided rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFEREE --> referee4
      expect(afterReferee4Balance.toBigInt()).to.equal(
        chain.initialReferee4Balance.toBigInt() -
          ethConverter(rdPaymentValue).toBigInt() -
          txCost.toBigInt() +
          ethConverter(expectedRefereeReward).toBigInt()
      );

      // REFERRERS

      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee3
      expect(afterReferee3Balance.toBigInt()).to.equal(
        chain.initialReferee3Balance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );

      // OUT OF REWARD LEVELS REFERRERS --> will not receive rewards since they are over the max level

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt()
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedTotalPaidOutReward).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should distribute 5-level (final referee) rewards correctly after referee completed referral process`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for final referee
      const completionPayment = await chain.proxyContract
        .connect(chain.finalReferee)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const txCost = await getTransactionCosts(completionPayment);

      // calculate result values
      // still 3 since rdMaxRewardLevel is 3 as well!!!
      const numberOfRewardLevels = 3;
      const registeredPaidValue = rdPaymentValue * 2;

      const referrerPercentage = 100 - rdRefereePercentage;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * rdReferralPercentage;
      // account balances
      const afterFinalRefereeBalance = await chain.finalReferee.getBalance();
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterReferee2Balance = await chain.referee2.getBalance();
      const afterReferee3Balance = await chain.referee3.getBalance();
      const afterReferee4Balance = await chain.referee4.getBalance();

      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward =
        (registeredPaidValue / 100) * rdReferralPercentage;
      // reward for referee
      const expectedRefereeReward =
        (expectedTotalPaidOutReward / 100) * rdRefereePercentage;
      // reward for all referrers
      const expectedReferrerReward =
        (expectedTotalPaidOutReward / 100) * referrerPercentage;
      // reward for a single referrer
      const expectedRefereeRewardProportion =
        expectedReferrerReward / numberOfRewardLevels;

      // assert two-sided rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFEREE --> final referee
      expect(afterFinalRefereeBalance.toBigInt()).to.equal(
        chain.initialFinalRefereeBalance.toBigInt() -
          ethConverter(rdPaymentValue).toBigInt() -
          txCost.toBigInt() +
          ethConverter(expectedRefereeReward).toBigInt()
      );

      // REFERRERS

      // referee2
      expect(afterReferee2Balance.toBigInt()).to.equal(
        chain.initialReferee2Balance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee3
      expect(afterReferee3Balance.toBigInt()).to.equal(
        chain.initialReferee3Balance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );
      // referee4
      expect(afterReferee4Balance.toBigInt()).to.equal(
        chain.initialReferee4Balance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );

      // OUT OF REWARD LEVELS REFERRERS --> will not receive rewards since they are over the max level

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt()
      );

      // referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt()
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedTotalPaidOutReward).toBigInt()
      );
    });

    it(`${CONTRACT_NAME} should distribute multiple (1-level & 2-level) rewards correctly after referees completed referral processes`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 1
      await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const initialAfterCompletionPaymentRefereeBalance =
        await chain.referee.getBalance();

      // complete referral process for referee 2
      await chain.proxyContract
        .connect(chain.referee2)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      // calculate result values
      const registeredPaidValue = rdPaymentValue * 2;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * DEFAULT_REFERRAL_PERCENTAGE;
      // account balances
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedPaidOutReward =
        (registeredPaidValue / 100) * DEFAULT_REFERRAL_PERCENTAGE;

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

    it(`${CONTRACT_NAME} should throw if referee with completed process wants to register payment`, async () => {
      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 1
      await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const completedRefereePaymentTxPromise = chain.proxyContract
        .connect(referee)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      // await calls to be rejected since referral has been completed
      await expect(completedRefereePaymentTxPromise).to.be.rejectedWith(
        REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Referral Completion and Reward Payments
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Special Two-Sided Reward Setup`, async () => {
    // -----------------------------------------------------------------------------------------------
    // Testing Referral Completion and Reward Payments
    // -----------------------------------------------------------------------------------------------

    it(`${CONTRACT_NAME} should distribute 1-level rewards only to referrer`, async () => {
      // referral conditions ONE SIDED Rewards
      const rdPaymentValue = 12;
      const rdReferralPercentage = 20;
      const rdRefereePercentage = 0;
      const rdPaymentsValueThreshold = rdPaymentValue;
      const rdPaymentsQuantityThreshold = 1;
      const rdMaxRewardLevel = 3;

      // get fixture function for testing
      const rewardDistributionFixture = async () => {
        return deployV2MultilevelReferralRewardFixture({
          contractName: CONTRACT_NAME,
          referralPercentage: rdReferralPercentage,
          refereePercentage: rdRefereePercentage,
          paymentQuantityThreshold: rdPaymentsQuantityThreshold,
          paymentValueThreshold: rdPaymentsValueThreshold,
          maxRewardLevels: rdMaxRewardLevel,
        });
      };

      const {
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
      } = await loadFixture(rewardDistributionFixture);

      // create referral chain payments
      const chain = await createReferralChain({
        rootReferrer,
        referee,
        referee2,
        referee3,
        referee4,
        finalReferee,
        proxyContract,
        paymentValue: rdPaymentValue,
      });

      // complete referral process for referee 1
      const completionPayment = await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: ethConverter(rdPaymentValue),
        });

      const txCost = await getTransactionCosts(completionPayment);

      // calculate result values
      const numberOfRewardLevels = 1;
      const registeredPaidValue = rdPaymentValue * 2;

      const referrerPercentage = 100 - rdRefereePercentage;
      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractReward =
        (rdPaymentValue / 100) * rdReferralPercentage;
      // account balances
      const afterRefereeBalance = await chain.referee.getBalance();
      const afterRootReferralBalance = await chain.rootReferrer.getBalance();
      const afterContractBalance = await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward =
        (registeredPaidValue / 100) * rdReferralPercentage;
      // reward for referee
      const expectedRefereeReward =
        (expectedTotalPaidOutReward / 100) * rdRefereePercentage;
      // reward for all referrers
      const expectedReferrerReward =
        (expectedTotalPaidOutReward / 100) * referrerPercentage;
      // reward for a single referrer
      const expectedRefereeRewardProportion =
        expectedReferrerReward / numberOfRewardLevels;

      // assert two-sided rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFEREE --> referee
      expect(afterRefereeBalance.toBigInt()).to.equal(
        chain.initialRefereeBalance.toBigInt() -
          ethConverter(rdPaymentValue).toBigInt() -
          txCost.toBigInt() +
          ethConverter(expectedRefereeReward).toBigInt()
      );

      // REFERRERS

      // root referrer
      expect(afterRootReferralBalance.toBigInt()).to.equal(
        chain.initialRootReferrerBalance.toBigInt() +
          ethConverter(expectedRefereeRewardProportion).toBigInt()
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance.toBigInt()).to.equal(
        chain.initialContractBalance.toBigInt() +
          ethConverter(completionPaymentContractReward).toBigInt() -
          ethConverter(expectedTotalPaidOutReward).toBigInt()
      );
    });
  });
});
