// -----------------------------------------------------------------------------------------------
// test helper constants with error strings that are returned by the implemented contracts
// have to be adjusted to the error messages that are specified in the smart contracts
// -----------------------------------------------------------------------------------------------

export const EXACT_AMOUNT_ERROR = "tx must send exact payment amount";

export const REWARD_AMOUNT_PROPORTION_ERROR =
  "reward must be portion of paymentAmount";

export const OWNABLE_ERROR_STRING = "Ownable: caller is not the owner";

export const REWARD_PERCENTAGE_OUT_OF_BOUNDS =
  "percentage value must be between 0 and 100";

export const REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED =
  "Referral process has been completed for this address";

export const SENDER_CANNOT_BE_REFERRER = "Sender cannot be referrer";

export const REFERRER_IS_NOT_REGISTERED =
  "Referrer must be a registered address";

export const ROOT_ADDRESS_CANNOT_BE_REFEREE =
  "Root address cannot be a referee";

export const NO_REWARDS_TO_CLAIM = "No rewards to claim";

export const MIN_REWARD_LEVELS = "minimum reward levels is 1";
