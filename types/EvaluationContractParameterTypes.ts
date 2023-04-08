// includes string for readability in evaluation logs

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Transmitter Contract Params
// -----------------------------------------------------------------------------------------------

// includes string for readability in  evaluation logs
export type EvaluationPaymentTransmitterContractParams = {
  paymentAmount: string;
  referralReward: string;
};

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Quantity Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentQuantityContractParams = {
  referralPercentage: string;
  quantityThreshold: string;
};

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Value Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentValueContractParams = {
  referralPercentage: string;
  valueThreshold: string;
};

export type V3EvaluationPaymentValueContractParams =
  EvaluationPaymentValueContractParams & {
    refereeRewardPercentage: string;
  };

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Multilevel Rewards Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentMultilevelRewardContractParams = {
  referralPercentage: string;
  quantityThreshold: string;
  valueThreshold: string;
};

export type V2EvaluationPaymentMultilevelRewardContractParams = {
  referralPercentage: string;
  refereePercentage: string;
  quantityThreshold: string;
  valueThreshold: string;
  maxRewardLevel: string;
};

// -----------------------------------------------------------------------------------------------
// EvaluationPayment Multilevel Token Rewards Contract Params
// -----------------------------------------------------------------------------------------------

export type EvaluationPaymentMultilevelTokenRewardContractParams = {
  token: string;
  referralPercentage: string;
  refereePercentage: string;
  quantityThreshold: string;
  valueThreshold: string;
  maxRewardLevel: string;
};
