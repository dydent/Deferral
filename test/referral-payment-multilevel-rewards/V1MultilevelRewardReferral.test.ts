import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { etherUnitConverter } from "../../helpers/unit-converters";
import { expect } from "chai";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REFERRER_IS_NOT_REGISTERED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
  ROOT_ADDRESS_CANNOT_BE_REFEREE,
  SENDER_CANNOT_BE_REFERRER,
} from "../../helpers/constants/error-strings";
import { deployMultilevelReferralRewardFixture } from "../../helpers/test-helpers/multilevel-reward-referral-fixtures";
import { ethers, upgrades } from "hardhat";
import { createReferralChain } from "../../helpers/test-helpers/create-referral-chain";
import { V1ReferralMultilevelRewardsUpgradable } from "../../typechain-types/contracts/referral-evaluators/referral-payment-multilevel-rewards/V1ReferralMultilevelRewardsUpgradable";
import { BigNumber } from "ethers";
import { EtherUnits } from "../../types/ValidUnitTypes";
import { PercentageType } from "../../types/PercentageTypes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";

// -----------------------------------------------------------------------------------------------
// TEST CONFIG VALUES
// -----------------------------------------------------------------------------------------------
const TEST_PRECISION_DELTA = 1e1;

const CONTRACT_NAME = "V1ReferralMultilevelRewardsUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

const DEFAULT_UNIT: EtherUnits = EtherUnits.Ether;
// must be between 0 and 100!
const DEFAULT_REFERRAL_PERCENTAGE: PercentageType = 30;
// number of payment transactions for a referral process to be complete = thresholds + 1
const DEFAULT_QUANTITY_THRESHOLD: BigNumber = BigNumber.from(3);
const DEFAULT_VALUE_THRESHOLD: BigNumber = etherUnitConverter[DEFAULT_UNIT](
  BigNumber.from(15)
);
// noinspection DuplicatedCode
describe(`Testing ${CONTRACT_NAME} Referral Contract`, async () => {
  // get fixture function for testing
  const defaultFixture = async () => {
    return deployMultilevelReferralRewardFixture<V1ReferralMultilevelRewardsUpgradable>(
      {
        contractName: CONTRACT_NAME,
        referralPercentage: DEFAULT_REFERRAL_PERCENTAGE,
        paymentQuantityThreshold: DEFAULT_QUANTITY_THRESHOLD,
        paymentValueThreshold: DEFAULT_VALUE_THRESHOLD,
      }
    );
  };

  // -----------------------------------------------------------------------------------------------
  // Testing Contract Deployment
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Contract Deployment`, async () => {
    it(`${CONTRACT_NAME} should throw if deployed with incorrect referral reward param`, async () => {
      const [receiver] = await ethers.getSigners();

      const incorrectRewardPercentage: number = 105;

      const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

      const deployedProxyContractPromise = upgrades.deployProxy(
        referralContract,
        [
          receiver.address,
          incorrectRewardPercentage,
          DEFAULT_QUANTITY_THRESHOLD,
          DEFAULT_VALUE_THRESHOLD,
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
      const initialAddress: string = await proxyContract.receiverAddress();
      const updateAddress: string = await updatedReceiver.getAddress();
      expect(initialAddress).to.not.equal(updateAddress);
      // update receiver address
      await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
      const contractReceiverAddress: string =
        await proxyContract.receiverAddress();
      // assert address is updated
      expect(updateAddress).to.equal(contractReceiverAddress);
    });
    it(`${CONTRACT_NAME} should update referral reward percentage`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues: PercentageType[] = [0, 20, 100];
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
      const invalidUpdateValues: number[] = [101, 500];
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

    it(`${CONTRACT_NAME} should update payments quantity threshold`, async () => {
      const { admin, proxyContract } = await loadFixture(defaultFixture);
      // test with regular and inbound boundary values
      const validUpdateValues: BigNumber[] = [
        BigNumber.from(1),
        BigNumber.from(5),
        BigNumber.from(10),
      ];
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
      const validUpdateValues: BigNumber[] = [
        etherUnitConverter[DEFAULT_UNIT](BigNumber.from(10)),
        etherUnitConverter[DEFAULT_UNIT](BigNumber.from(50)),
        etherUnitConverter[DEFAULT_UNIT](BigNumber.from(100)),
      ];
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
  // Testing Function Modifiers
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Function Modifiers`, async () => {
    it(`${CONTRACT_NAME} should throw if non-admin tries to update contract`, async () => {
      const { rootReferrer, updatedReceiver, proxyContract } =
        await loadFixture(defaultFixture);
      const nonAdminSigner: SignerWithAddress = rootReferrer;
      const validReferralReward: BigNumber = etherUnitConverter[DEFAULT_UNIT](
        BigNumber.from(3)
      );
      const validReceiverAddress: string = await updatedReceiver.getAddress();
      const validPaymentQuantity: BigNumber = BigNumber.from(100);
      const validPaymentsValue: BigNumber = etherUnitConverter[DEFAULT_UNIT](
        BigNumber.from(50)
      );
      const expectedError: string = OWNABLE_ERROR_STRING;

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
  // Testing Referral Process Functionality
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Referral Process Functionality`, async () => {
    // referral conditions for process testing
    const ptUnit = EtherUnits.Ether;
    const ptPaymentValue: BigNumber = etherUnitConverter[ptUnit](10);
    const ptReferralPercentage: PercentageType = 11;
    const ptPaymentsValueThreshold: BigNumber = BigNumber.from(100);
    const ptPaymentsQuantityThreshold: BigNumber = BigNumber.from(5);

    // get fixture function for testing
    const processTestingFixture = async () => {
      return deployMultilevelReferralRewardFixture<V1ReferralMultilevelRewardsUpgradable>(
        {
          contractName: CONTRACT_NAME,
          referralPercentage: ptReferralPercentage,
          paymentQuantityThreshold: ptPaymentsQuantityThreshold,
          paymentValueThreshold: ptPaymentsValueThreshold,
        }
      );
    };

    it(`${CONTRACT_NAME} should throw if sender/referee is referrer`, async () => {
      const { referee, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // register referee with root referrer as referee
      const refereePaymentTxPromise = proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](referee.address, {
          value: ptPaymentValue,
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
        ["registerReferralPayment()"]({ value: ptPaymentValue });
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
      expect(rootReferrerMapping.paymentsValue).to.equal(ptPaymentValue);
      expect(rootReferrerMapping.paymentsQuantity).to.equal(1);
    });

    it(`${CONTRACT_NAME} should register payment of registered referee with empty referrer param correctly`, async () => {
      const { rootReferrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
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
      expect(refereeProcessMapping.paymentsValue).to.be.equal(ptPaymentValue);
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register another referee payment with empty referral address param
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
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
        ptPaymentValue.mul(2)
      );
      expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
    });

    it(`${CONTRACT_NAME} should register payment of registered referee with different registered referrer correctly (referrer address cannot be changed)`, async () => {
      const { rootReferrer, rootReferrer2, referee, proxyContract } =
        await loadFixture(processTestingFixture);
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });
      await proxyContract
        .connect(rootReferrer2)
        ["registerReferralPayment()"]({ value: ptPaymentValue });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
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
      expect(refereeProcessMapping.paymentsValue).to.equal(ptPaymentValue);
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register another referee payment with different registered referral address param
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer2.address, {
          value: ptPaymentValue,
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
        ptPaymentValue.mul(2)
      );
      expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
    });

    it(`${CONTRACT_NAME} should register payment of referee with higher level referee and update data correctly`, async () => {
      const { rootReferrer, referee, referee2, proxyContract } =
        await loadFixture(processTestingFixture);
      // register root referrer
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });
      // register referee with root referrer as referee
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
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
      expect(refereeProcessMapping.paymentsValue).to.equal(ptPaymentValue);
      expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

      // register new referee with higher level referee as referrer
      await proxyContract
        .connect(referee2)
        ["registerReferralPayment(address)"](referee.address, {
          value: ptPaymentValue,
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
      expect(referee2ProcessMapping.paymentsValue).to.equal(ptPaymentValue);
      expect(referee2ProcessMapping.paymentsQuantity).to.equal(1);
    });

    it(`${CONTRACT_NAME} should throw if referrer address is not registered as referee or root referrer`, async () => {
      const { rootReferrer, referee, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // register referee with root referrer as referee
      const refereePaymentTxPromise = proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
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
        ["registerReferralPayment()"]({ value: ptPaymentValue });
      await proxyContract
        .connect(rootReferrer2)
        ["registerReferralPayment()"]({ value: ptPaymentValue });

      // try register root referrer with other referrer address
      const rootAsRefereePaymentTx = proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment(address)"](rootReferrer2.address, {
          value: ptPaymentValue,
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
      const initialRootReferrerBalance: BigNumber =
        await rootReferrer.getBalance();
      const initialReceiverBalance: BigNumber = await receiver.getBalance();

      // root referrer payment registers address as root
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });

      // calculate referral transaction costs
      const txCost: BigNumber = await getTransactionCosts(
        rootReferrerPaymentTx
      );

      // calculate result values
      const finalContractBalance: BigNumber = await proxyContract.getBalance();
      const afterReceiverBalance: BigNumber = await receiver.getBalance();
      const afterRootReferrerBalance: BigNumber =
        await rootReferrer.getBalance();

      // assert balances are correct
      expect(afterReceiverBalance).to.be.closeTo(
        initialReceiverBalance.add(ptPaymentValue),
        TEST_PRECISION_DELTA
      );
      expect(afterRootReferrerBalance).to.be.closeTo(
        initialRootReferrerBalance.sub(ptPaymentValue).sub(txCost),
        TEST_PRECISION_DELTA
      );
      expect(finalContractBalance).to.equal(0);
    });

    it(`${CONTRACT_NAME} should forward multiple root referrer payments and update data correctly`, async () => {
      const { receiver, rootReferrer, proxyContract } = await loadFixture(
        processTestingFixture
      );

      // register root referrer with payment
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });

      const initialRootReferrerBalance: BigNumber =
        await rootReferrer.getBalance();
      const initialReceiverBalance: BigNumber = await receiver.getBalance();

      // second root referrer payment
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });
      // calculate referral transaction costs
      const txCost: BigNumber = await getTransactionCosts(
        rootReferrerPaymentTx
      );

      // calculate result values
      const rootReferrerMapping = await proxyContract.refereeProcessMapping(
        rootReferrer.address
      );
      const finalContractBalance: BigNumber = await proxyContract.getBalance();
      const afterReceiverBalance: BigNumber = await receiver.getBalance();
      const afterRootReferrerBalance: BigNumber =
        await rootReferrer.getBalance();

      // assert balances are correct
      expect(afterReceiverBalance).to.be.closeTo(
        initialReceiverBalance.add(ptPaymentValue),
        TEST_PRECISION_DELTA
      );
      expect(afterRootReferrerBalance).to.be.closeTo(
        initialRootReferrerBalance.sub(ptPaymentValue).sub(txCost),
        TEST_PRECISION_DELTA
      );
      expect(finalContractBalance).to.equal(0);

      // assert root referrer data is updated and registered correctly
      expect(rootReferrerMapping.isRoot).to.equal(true);
      expect(rootReferrerMapping.referralProcessCompleted).to.equal(false);
      expect(rootReferrerMapping.referrerAddressHasBeenSet).to.equal(false);
      expect(rootReferrerMapping.parentReferrerAddress).to.equal(
        ethers.constants.AddressZero
      );
      expect(rootReferrerMapping.paymentsValue).to.equal(ptPaymentValue.mul(2));
      expect(rootReferrerMapping.paymentsQuantity).to.equal(2);
    });

    it(`${CONTRACT_NAME} should forward referee payment with referrer address param correctly`, async () => {
      const { receiver, referee, rootReferrer, proxyContract } =
        await loadFixture(processTestingFixture);

      // root referrer payment registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });

      const initialRefereeBalance: BigNumber = await referee.getBalance();
      const initialReceiverBalance: BigNumber = await receiver.getBalance();
      const initialContractValue: BigNumber = await proxyContract.getBalance();

      // execute referee payment with root referrer as referrer address
      const refereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
        });

      // calculate referral transaction costs
      const txCost: BigNumber = await getTransactionCosts(refereePaymentTx);

      // calculate result values
      const reward: BigNumber = ptPaymentValue
        .mul(ptReferralPercentage)
        .div(100);
      const receiverAmount: BigNumber = ptPaymentValue.sub(reward);

      const finalContractBalance: BigNumber = await proxyContract.getBalance();
      const afterReceiverBalance: BigNumber = await receiver.getBalance();
      const afterRefereeBalance: BigNumber = await referee.getBalance();

      // assert balances are correct
      expect(afterReceiverBalance).to.be.closeTo(
        initialReceiverBalance.add(receiverAmount),
        TEST_PRECISION_DELTA
      );
      expect(afterRefereeBalance).to.be.closeTo(
        initialRefereeBalance.sub(ptPaymentValue).sub(txCost),
        TEST_PRECISION_DELTA
      );
      expect(finalContractBalance).to.be.closeTo(
        initialContractValue.add(reward),
        TEST_PRECISION_DELTA
      );
    });

    it(`${CONTRACT_NAME} should forward referee payment with empty referrer address param correctly`, async () => {
      const { receiver, referee, rootReferrer, proxyContract } =
        await loadFixture(processTestingFixture);

      // root referrer payment registers address as root
      await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ptPaymentValue });

      // execute referee payment to register referee as referee with root referrer
      await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ptPaymentValue,
        });

      const initialRefereeBalance: BigNumber = await referee.getBalance();
      const initialReceiverBalance: BigNumber = await receiver.getBalance();
      const initialContractValue: BigNumber = await proxyContract.getBalance();

      // execute referee payment empty address param
      const refereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment()"]({
          value: ptPaymentValue,
        });

      // calculate referral transaction costs
      const txCost: BigNumber = await getTransactionCosts(refereePaymentTx);

      // calculate result values
      const reward: BigNumber = ptPaymentValue
        .mul(ptReferralPercentage)
        .div(100);

      const receiverAmount: BigNumber = ptPaymentValue.sub(reward);

      const finalContractBalance: BigNumber = await proxyContract.getBalance();
      const afterReceiverBalance: BigNumber = await receiver.getBalance();
      const afterRefereeBalance: BigNumber = await referee.getBalance();

      // assert balances are correct
      expect(afterReceiverBalance).to.be.closeTo(
        initialReceiverBalance.add(receiverAmount),
        TEST_PRECISION_DELTA
      );
      expect(afterRefereeBalance).to.be.closeTo(
        initialRefereeBalance.sub(ptPaymentValue).sub(txCost),
        TEST_PRECISION_DELTA
      );
      expect(finalContractBalance).to.be.closeTo(
        initialContractValue.add(reward),
        TEST_PRECISION_DELTA
      );
    });
  });

  // -----------------------------------------------------------------------------------------------
  // Testing Distributing Referral Rewards
  // -----------------------------------------------------------------------------------------------

  describe(`Testing Distributing Multi Level Rewards Functionality`, async () => {
    // referral conditions for testing reward distribution (rd)
    const rdUnit = EtherUnits.Ether;
    const rdPaymentValue: BigNumber = etherUnitConverter[rdUnit](10);
    const rdPaymentsValueThreshold: BigNumber = rdPaymentValue;
    const rdPaymentsQuantityThreshold: BigNumber = BigNumber.from(1);
    const rdReferralPercentage: PercentageType = 10;

    // get fixture function for testing
    const rewardDistributionFixture = async () => {
      return deployMultilevelReferralRewardFixture<V1ReferralMultilevelRewardsUpgradable>(
        {
          contractName: CONTRACT_NAME,
          referralPercentage: rdReferralPercentage,
          paymentQuantityThreshold: rdPaymentsQuantityThreshold,
          paymentValueThreshold: rdPaymentsValueThreshold,
        }
      );
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
      await chain.proxyContract
        .connect(chain.referee)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      const numberOfRewardLevels: BigNumber = BigNumber.from(1);

      const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractRewardProportion: BigNumber =
        rdPaymentValue.mul(rdReferralPercentage).div(100);

      // account balances
      const afterRootReferralBalance: BigNumber =
        await chain.rootReferrer.getBalance();
      const afterContractBalance: BigNumber =
        await chain.proxyContract.getBalance();

      // calculate reward values
      const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
        .mul(rdReferralPercentage)
        .div(100);

      // reward for a single referrer
      const expectedReferrerRewardProportion: BigNumber =
        expectedTotalPaidOutReward.div(numberOfRewardLevels);

      // assert  rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFERRERS

      // root referrer
      expect(afterRootReferralBalance).to.be.closeTo(
        chain.initialRootReferrerBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance).to.be.closeTo(
        chain.initialContractBalance
          .add(completionPaymentContractRewardProportion)
          .sub(expectedTotalPaidOutReward),
        TEST_PRECISION_DELTA
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
      await chain.proxyContract
        .connect(chain.referee2)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      const numberOfRewardLevels: BigNumber = BigNumber.from(2);

      const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractRewardProportion: BigNumber =
        rdPaymentValue.mul(rdReferralPercentage).div(100);

      // account balances
      const afterRefereeBalance: BigNumber = await chain.referee.getBalance();
      const afterRootReferralBalance: BigNumber =
        await chain.rootReferrer.getBalance();
      const afterContractBalance: BigNumber =
        await chain.proxyContract.getBalance();

      // calculate reward values
      const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
        .mul(rdReferralPercentage)
        .div(100);

      // reward for a single referrer
      const expectedReferrerRewardProportion: BigNumber =
        expectedTotalPaidOutReward.div(numberOfRewardLevels);

      // assert  rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFERRERS

      // referee 1
      expect(afterRefereeBalance).to.be.closeTo(
        chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // root referrer
      expect(afterRootReferralBalance).to.be.closeTo(
        chain.initialRootReferrerBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance).to.be.closeTo(
        chain.initialContractBalance
          .add(completionPaymentContractRewardProportion)
          .sub(expectedTotalPaidOutReward),
        TEST_PRECISION_DELTA
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
      await chain.proxyContract
        .connect(chain.referee3)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      const numberOfRewardLevels: BigNumber = BigNumber.from(3);

      const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractRewardProportion: BigNumber =
        rdPaymentValue.mul(rdReferralPercentage).div(100);

      // account balances
      const afterReferee2Balance: BigNumber = await chain.referee2.getBalance();
      const afterRefereeBalance: BigNumber = await chain.referee.getBalance();
      const afterRootReferralBalance: BigNumber =
        await chain.rootReferrer.getBalance();
      const afterContractBalance: BigNumber =
        await chain.proxyContract.getBalance();

      // calculate reward values
      const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
        .mul(rdReferralPercentage)
        .div(100);

      // reward for a single referrer
      const expectedReferrerRewardProportion: BigNumber =
        expectedTotalPaidOutReward.div(numberOfRewardLevels);

      // assert  rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFERRERS

      // referee 2
      expect(afterReferee2Balance).to.be.closeTo(
        chain.initialReferee2Balance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // referee 1
      expect(afterRefereeBalance).to.be.closeTo(
        chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // root referrer
      expect(afterRootReferralBalance).to.be.closeTo(
        chain.initialRootReferrerBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance).to.be.closeTo(
        chain.initialContractBalance
          .add(completionPaymentContractRewardProportion)
          .sub(expectedTotalPaidOutReward),
        TEST_PRECISION_DELTA
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
      await chain.proxyContract
        .connect(chain.referee4)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      const numberOfRewardLevels: BigNumber = BigNumber.from(4);

      const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractRewardProportion: BigNumber =
        rdPaymentValue.mul(rdReferralPercentage).div(100);

      // account balances
      const afterReferee3Balance: BigNumber = await chain.referee3.getBalance();
      const afterReferee2Balance: BigNumber = await chain.referee2.getBalance();
      const afterRefereeBalance: BigNumber = await chain.referee.getBalance();
      const afterRootReferralBalance: BigNumber =
        await chain.rootReferrer.getBalance();
      const afterContractBalance: BigNumber =
        await chain.proxyContract.getBalance();

      // calculate reward values
      const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
        .mul(rdReferralPercentage)
        .div(100);

      // reward for a single referrer
      const expectedReferrerRewardProportion: BigNumber =
        expectedTotalPaidOutReward.div(numberOfRewardLevels);

      // assert  rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFERRERS

      // referee 3
      expect(afterReferee3Balance).to.be.closeTo(
        chain.initialReferee3Balance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );
      // referee 2
      expect(afterReferee2Balance).to.be.closeTo(
        chain.initialReferee2Balance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // referee 1
      expect(afterRefereeBalance).to.be.closeTo(
        chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // root referrer
      expect(afterRootReferralBalance).to.be.closeTo(
        chain.initialRootReferrerBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance).to.be.closeTo(
        chain.initialContractBalance
          .add(completionPaymentContractRewardProportion)
          .sub(expectedTotalPaidOutReward),
        TEST_PRECISION_DELTA
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
      await chain.proxyContract
        .connect(chain.finalReferee)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      const numberOfRewardLevels: BigNumber = BigNumber.from(5);

      const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractRewardProportion: BigNumber =
        rdPaymentValue.mul(rdReferralPercentage).div(100);

      // account balances
      const afterReferee4Balance: BigNumber = await chain.referee4.getBalance();
      const afterReferee3Balance: BigNumber = await chain.referee3.getBalance();
      const afterReferee2Balance: BigNumber = await chain.referee2.getBalance();
      const afterRefereeBalance: BigNumber = await chain.referee.getBalance();
      const afterRootReferralBalance: BigNumber =
        await chain.rootReferrer.getBalance();
      const afterContractBalance: BigNumber =
        await chain.proxyContract.getBalance();

      // calculate reward values
      const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
        .mul(rdReferralPercentage)
        .div(100);

      // reward for a single referrer
      const expectedReferrerRewardProportion: BigNumber =
        expectedTotalPaidOutReward.div(numberOfRewardLevels);

      // assert  rewards have been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // REFERRERS

      // referee 4
      expect(afterReferee4Balance).to.be.closeTo(
        chain.initialReferee4Balance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // referee 3
      expect(afterReferee3Balance).to.be.closeTo(
        chain.initialReferee3Balance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // referee 2
      expect(afterReferee2Balance).to.be.closeTo(
        chain.initialReferee2Balance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // referee 1
      expect(afterRefereeBalance).to.be.closeTo(
        chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // root referrer
      expect(afterRootReferralBalance).to.be.closeTo(
        chain.initialRootReferrerBalance.add(expectedReferrerRewardProportion),
        TEST_PRECISION_DELTA
      );

      // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
      expect(afterContractBalance).to.be.closeTo(
        chain.initialContractBalance
          .add(completionPaymentContractRewardProportion)
          .sub(expectedTotalPaidOutReward),
        TEST_PRECISION_DELTA
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
          value: rdPaymentValue,
        });

      const initialAfterCompletionPaymentRefereeBalance =
        await chain.referee.getBalance();

      // complete referral process for referee 2
      await chain.proxyContract
        .connect(chain.referee2)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      // calculate result values
      const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

      // proportion of the completion payment that stays on the reward contract
      const completionPaymentContractRewardProportion: BigNumber =
        rdPaymentValue.mul(rdReferralPercentage).div(100);

      // account balances
      const afterRootReferralBalance: BigNumber =
        await chain.rootReferrer.getBalance();
      const afterRefereeBalance: BigNumber = await chain.referee.getBalance();
      const afterContractBalance: BigNumber =
        await chain.proxyContract.getBalance();
      // reward values
      const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
        .mul(rdReferralPercentage)
        .div(100);

      const firstLevelRewardProportion: BigNumber = expectedTotalPaidOutReward;
      const secondLevelRewardProportion: BigNumber =
        expectedTotalPaidOutReward.div(2);

      // assert reward has been paid out correctly to all parties after completion
      // -------------------------------------------------------------------------

      // root referrer receives 2x rewards since both referee1 and referee2 have completed process
      expect(afterRootReferralBalance).to.be.closeTo(
        chain.initialRootReferrerBalance
          .add(firstLevelRewardProportion)
          .add(secondLevelRewardProportion),
        TEST_PRECISION_DELTA
      );

      // referee should receive rewards also if they have completed the process
      expect(afterRefereeBalance).to.be.closeTo(
        initialAfterCompletionPaymentRefereeBalance.add(
          secondLevelRewardProportion
        ),
        TEST_PRECISION_DELTA
      );

      // contract --> initial contract balance + 2x completion payment reward amount that was received -  2x distributed rewards
      expect(afterContractBalance).to.be.closeTo(
        chain.initialContractBalance
          .add(completionPaymentContractRewardProportion.mul(2))
          .sub(expectedTotalPaidOutReward.mul(2)),
        TEST_PRECISION_DELTA
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
          value: rdPaymentValue,
        });

      const completedRefereePaymentTxPromise = chain.proxyContract
        .connect(referee)
        ["registerReferralPayment()"]({
          value: rdPaymentValue,
        });

      // await calls to be rejected since referral has been completed
      await expect(completedRefereePaymentTxPromise).to.be.rejectedWith(
        REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED
      );
    });
  });
});
