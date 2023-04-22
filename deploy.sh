#!/bin/bash


# to execute this script run in the console:
# chmod +x deploy.sh
# then to execute the script run:
# Using the default value (hardhat)
# ./deploy.sh
# or you can set the value to a custom network
# ./deploy.sh my_custom_network



network="${1:-hardhat}"

echo "Running deployment scripts with --network $network"

hardhat run scripts/deployment/referral-payment-transmitter/deploy-V1ReferralPaymentTransmitter.ts --network $network
hardhat run scripts/deployment/referral-payment-transmitter/deploy-V2ReferralPaymentTransmitterUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-transmitter/deploy-V3ReferralPaymentTransmitterUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-quantity/deploy-V1ReferralPaymentQuantityUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-quantity/deploy-V2ReferralPaymentQuantityUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-value/deploy-V1ReferralPaymentValueUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-value/deploy-V2ReferralPaymentValueUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-value/deploy-V3ReferralPaymentValueUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-multilevel-rewards/deploy-V1ReferralMultilevelRewardsUpgradable.ts --network $network
hardhat run scripts/deployment/referral-payment-multilevel-rewards/deploy-V2ReferralMultilevelRewardsUpgradable.ts --network $network
hardhat run scripts/deployment/referral-multilevel-token-rewards/deploy-V1MultilevelTokenRewardsUpgradable.ts --network $network
