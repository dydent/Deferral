module.exports = {
  istanbulReporter: ["html", "lcov", "text", "json"],
  providerOptions: {
    mnemonic: process.env.MNEMONIC,
  },
  silent: false,
};
