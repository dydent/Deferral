module.exports = {
  istanbulReporter: ["html", "lcov", "text", "json"],
  providerOptions: {
    mnemonic: process.env.MNEMONIC,
  },
  // skipFiles: [
  //   "referral-evaluators/referral-payment-transmitter/upgradable-contracts/UpgradableV1_ReferralPaymentTransmitter.sol",
  // ],

  silent: false,
};
