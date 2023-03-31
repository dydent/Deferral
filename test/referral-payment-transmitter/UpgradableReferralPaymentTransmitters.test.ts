import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployAndUpgradeUpgradablePaymentTransmitterFixture } from "../../helpers/test-helpers/payment-transmitter-fixtures";
import { BigNumber } from "ethers";
import { etherUnitConverter } from "../../helpers/unit-converters";
import { EtherUnits } from "../../types/ValidUnitTypes";

const INITIAL_UPGRADABLE_CONTRACT_NAME =
  "V2ReferralPaymentTransmitterUpgradable";
const UPGRADED_CONTRACT_NAME = "V3ReferralPaymentTransmitterUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------
const DEFAULT_UNIT: EtherUnits = EtherUnits.Ether;
const DEFAULT_PAYMENT_AMOUNT: BigNumber = etherUnitConverter[DEFAULT_UNIT](10);
// must be smaller than payment amount
const DEFAULT_REFERRAL_REWARD: BigNumber = etherUnitConverter[DEFAULT_UNIT](1);

describe(`Testing ${INITIAL_UPGRADABLE_CONTRACT_NAME} & ${UPGRADED_CONTRACT_NAME} Referral Contracts`, async () => {
  // helper function to deploy initial and upgrade with upgraded contract
  const deployFixture = async () => {
    return deployAndUpgradeUpgradablePaymentTransmitterFixture({
      contractName: INITIAL_UPGRADABLE_CONTRACT_NAME,
      upgradedContractName: UPGRADED_CONTRACT_NAME,
      paymentAmount: DEFAULT_PAYMENT_AMOUNT,
      referralReward: DEFAULT_REFERRAL_REWARD,
    });
  };

  // -----------------------------------------------------------------------------------------------
  // Testing Upgrades
  // -----------------------------------------------------------------------------------------------

  describe(`Testing OpenZeppelin Upgrades Pattern`, async () => {
    it(`Upgradable pattern works for ${UPGRADED_CONTRACT_NAME} and ${INITIAL_UPGRADABLE_CONTRACT_NAME}`, async () => {
      const {
        proxyContract,
        initialImplementationContractAddress,
        upgradedImplementationAddress,
        upgradedProxyContract,
      } = await loadFixture(deployFixture);

      // assertions
      expect(proxyContract.address).to.equal(upgradedProxyContract.address);
      expect(initialImplementationContractAddress).not.to.equal(
        upgradedImplementationAddress
      );
    });
  });
});
