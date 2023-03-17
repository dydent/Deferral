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

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const REFERRAL_PAYMENT_EVALUATOR_CONTRACT =
  "V1MultilevelRewardReferralUpgradable";
// must be between 0 and 100!
const REFERRAL_PERCENTAGE = 30;
const PAYMENT_AMOUNT = 10;
const REFERRAL_REWARD = (PAYMENT_AMOUNT / 100) * REFERRAL_PERCENTAGE;
const PRIZE = PAYMENT_AMOUNT - REFERRAL_REWARD;
// number of payment transactions for a referral process to be complete = thresholds + 1
const QUANTITY_THRESHOLD = 5;
const VALUE_THRESHOLD = 500;

// noinspection DuplicatedCode
describe(`"Testing ${REFERRAL_PAYMENT_EVALUATOR_CONTRACT} referral contract`, async () => {
  // get fixture function for testing
  const deployUpgradableFixture = async () => {
    return deployMultilevelReferralRewardFixture({
      contractName: REFERRAL_PAYMENT_EVALUATOR_CONTRACT,
      referralPercentage: REFERRAL_PERCENTAGE,
      paymentQuantityThreshold: QUANTITY_THRESHOLD,
      paymentValueThreshold: VALUE_THRESHOLD,
    });
  };

  // -----------------------------------------------------------------------------------------------
  // Unit tests for updating contract values
  // -----------------------------------------------------------------------------------------------

  describe(`testing stuff`, async () => {
    it(`${REFERRAL_PAYMENT_EVALUATOR_CONTRACT} should update receiver address`, async () => {
      const { admin, referrer, proxyContract } = await loadFixture(
        deployUpgradableFixture
      );
      const registerPayment = await proxyContract
        .connect(referrer)
        ["registerReferralPayment()"]({ value: ethConverter(10) });

      const referralProcessMapping = await proxyContract.refereeProcessMapping(
        referrer.address
      );
      console.log("referralProcessMapping", referralProcessMapping, "");
    });
  });
});
