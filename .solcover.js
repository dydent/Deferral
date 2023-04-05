module.exports = {
  istanbulReporter: ["html", "lcov", "text", "json"],
  providerOptions: {
    mnemonic: process.env.MNEMONIC,
  },
  skipFiles: ["tokens/DeferralToken.sol", "tokens/TwinDeferralToken.sol"],

  silent: false,
};
