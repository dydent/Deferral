// -----------------------------------------------------------------------------------------------
// test helper constants with error strings that are returned by the implemented contracts
// have to be adjusted to the error messages that are specified in the smart contracts
// -----------------------------------------------------------------------------------------------

export const EXACT_AMOUNT_ERROR = "tx must send exact payment amount";

export const REWARD_AMOUNT_PROPORTION_ERROR =
  "reward must be portion of paymentAmount";

export const OWNABLE_ERROR_STRING = "Ownable: caller is not the owner";

export const REWARD_PERCENTAGE_OUT_OF_BOUNDS =
  "reward percentage must be between 0 and 100";

export const REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED =
  "Referral process has been completed for this address";
