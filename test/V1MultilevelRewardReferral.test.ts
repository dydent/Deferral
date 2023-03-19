import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { expect } from "chai";
import {
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
} from "../helpers/constants/error-strings";
import { executeReferralPayment } from "../helpers/test-helpers/execute-referral-payments";
import { deployReferralPaymentEvaluatorFixture } from "../helpers/test-helpers/referral-payment-evaluator-fixtures";
import { deployMultilevelReferralRewardFixture } from "../helpers/test-helpers/multilevel-reward-referral-fixtures";
import { address } from "hardhat/internal/core/config/config-validation";
import { ethers } from "hardhat";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const MULTILEVEL_REWARDS_CONTRACT = "V1MultilevelRewardReferralUpgradable";
// must be between 0 and 100!
const REFERRAL_PERCENTAGE = 30;
const PAYMENT_AMOUNT = 10;
const REFERRAL_REWARD = (PAYMENT_AMOUNT / 100) * REFERRAL_PERCENTAGE;
const PRIZE = PAYMENT_AMOUNT - REFERRAL_REWARD;
// number of payment transactions for a referral process to be complete = thresholds + 1
const QUANTITY_THRESHOLD = 1;
const VALUE_THRESHOLD = 1;

// noinspection DuplicatedCode
describe(`"Testing ${MULTILEVEL_REWARDS_CONTRACT} referral contract`, async () => {
  // get fixture function for testing
  const deployUpgradableFixture = async () => {
    return deployMultilevelReferralRewardFixture({
      contractName: MULTILEVEL_REWARDS_CONTRACT,
      referralPercentage: REFERRAL_PERCENTAGE,
      paymentQuantityThreshold: QUANTITY_THRESHOLD,
      paymentValueThreshold: VALUE_THRESHOLD,
    });
  };

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`Testing ${MULTILEVEL_REWARDS_CONTRACT} contract referral process`, async () => {
    //TODO check where to place this contract in the test structure
    it(`${MULTILEVEL_REWARDS_CONTRACT} should register payment of new address as root referrer`, async () => {
      const { rootReferrer, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const paymentValue = 10;
      // execute root referrer payment registers address as root
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
    it(`${MULTILEVEL_REWARDS_CONTRACT} should distribute multilevel rewards correctly after completed referral process`, async () => {
      const {
        admin,
        rootReferrer,
        referee,
        referee2,
        finalReferee,
        referee3,
        proxyContract,
      } = await loadFixture(deployUpgradableFixture);
      const paymentValue = 10;
      const numberOfPaymentTransactions = 1;
      // root referrer payment registers address as root
      const rootReferrerPaymentTx = await proxyContract
        .connect(rootReferrer)
        ["registerReferralPayment()"]({ value: ethConverter(paymentValue) });

      // calculate referral transaction costs
      let txReceipt = await rootReferrerPaymentTx.wait();
      let txGasUsed = await txReceipt.gasUsed;
      let txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      let txCost = txGasUsed.mul(txEffectiveGasPrice);
      console.log("txCost 1", txCost, "");

      const initialRootReferrerBalance = await rootReferrer.getBalance();
      console.log("initialRootReferrerBalance", initialRootReferrerBalance, "");

      // execute 1-level referee payment with root referrer as referrer address
      const RefereePaymentTx = await proxyContract
        .connect(referee)
        ["registerReferralPayment(address)"](rootReferrer.address, {
          value: ethConverter(paymentValue),
        });

      // calculate referral transaction costs
      txReceipt = await RefereePaymentTx.wait();
      txGasUsed = await txReceipt.gasUsed;
      txEffectiveGasPrice = await txReceipt.effectiveGasPrice;
      txCost = txGasUsed.mul(txEffectiveGasPrice);
      console.log("txCost 2", txCost, "");

      const initial1levelRefereeBalance = await referee.getBalance();
      console.log(
        "initial1levelRefereeBalance",
        initial1levelRefereeBalance,
        ""
      );

      // // execute 1-level referee payment with root referrer as referrer address
      // const MidRefereePaymentTx = await proxyContract
      //   .connect(referee2)
      //   ["registerReferralPayment(address)"](referee.address, {
      //     value: ethConverter(paymentValue),
      //   });

      // execute final-level referee payment with 1-level referee as referrer address
      await proxyContract
        .connect(finalReferee)
        ["registerReferralPayment(address)"](referee.address, {
          value: ethConverter(paymentValue),
        });

      // complete referral process with 2-level referee
      await proxyContract
        .connect(finalReferee)
        ["registerReferralPayment(address)"](referee.address, {
          value: ethConverter(paymentValue),
        });

      const afterRootReferrerBalance = await rootReferrer.getBalance();
      const diff1 =
        afterRootReferrerBalance.toBigInt() -
        initialRootReferrerBalance.toBigInt();
      console.log("afterRootReferrerBalance", afterRootReferrerBalance, "");
      console.log("diff1", diff1, "");

      const after1levelRefereeBalance = await referee.getBalance();
      const diff2 =
        after1levelRefereeBalance.toBigInt() -
        initial1levelRefereeBalance.toBigInt();
      console.log("after1levelRefereeBalance", after1levelRefereeBalance, "");
      console.log("diff2", diff2, "");
    });
  });
});
