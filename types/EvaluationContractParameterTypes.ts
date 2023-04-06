// includes number for readability in  evaluation logs
import { BigNumber } from "ethers";
import { PercentageType } from "./PercentageTypes";

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Transmitter Contract Params
// -----------------------------------------------------------------------------------------------

// includes number for readability in  evaluation logs
export type EvaluationPaymentTransmitterContractParams = {
  paymentAmount: number;
  referralReward: number;
};

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Quantity Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentQuantityContractParams = {
  referralPercentage: PercentageType;
  quantityThreshold: BigNumber;
};

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Value Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentValueContractParams = {
  referralPercentage: PercentageType;
  valueThreshold: number;
};

export type V3EvaluationPaymentValueContractParams =
  EvaluationPaymentValueContractParams & {
    refereeRewardPercentage: PercentageType;
  };

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Multilevel Rewards Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentMultilevelRewardContractParams = {
  referralPercentage: PercentageType;
  quantityThreshold: number;
  valueThreshold: number;
};

export type V2EvaluationPaymentMultilevelRewardContractParams = {
  referralPercentage: PercentageType;
  refereePercentage: PercentageType;
  quantityThreshold: number;
  valueThreshold: number;
  maxRewardLevel: number;
};

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Multilevel Token Rewards Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentMultilevelTokenRewardContractParams = {
  token: string;
  referralPercentage: PercentageType;
  refereePercentage: PercentageType;
  quantityThreshold: number;
  valueThreshold: number;
  maxRewardLevel: number;
};
