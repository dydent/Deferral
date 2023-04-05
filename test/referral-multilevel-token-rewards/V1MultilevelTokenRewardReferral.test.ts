import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  MIN_REWARD_LEVELS,
  NON_ZERO_ADDRESS,
  OWNABLE_ERROR_STRING,
  REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED,
  REFERRER_IS_NOT_REGISTERED,
  REWARD_PERCENTAGE_OUT_OF_BOUNDS,
  ROOT_ADDRESS_CANNOT_BE_REFEREE,
  SENDER_CANNOT_BE_REFERRER,
} from "../../helpers/constants/error-strings";
import { ethers, upgrades } from "hardhat";
import { getTransactionCosts } from "../../helpers/get-transaction-costs";
import { BigNumber, constants, Contract, ContractFactory } from "ethers";
import { PercentageType } from "../../types/PercentageTypes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Deferral,
  TwinDeferral,
  V1ReferralMultilevelTokenRewardsUpgradable,
} from "../../typechain-types";
import { createTokenReferralChain } from "../../helpers/test-helpers/create-token-referral-chain";
import { deployMultilevelTokenReferralRewardFixture } from "../../helpers/test-helpers/multilevel-token-reward-referral-fixtures";

// -----------------------------------------------------------------------------------------------
// TEST CONFIG VALUES
// -----------------------------------------------------------------------------------------------
const TEST_PRECISION_DELTA = 1e1;

const CONTRACT_NAME = "V1ReferralMultilevelTokenRewardsUpgradable";

// -----------------------------------------------------------------------------------------------
// TEST DEFAULT VALUES
// -----------------------------------------------------------------------------------------------

const DEFAULT_TOKEN: string = "Deferral";
type DEFAULT_TOKEN_TYPE = Deferral;
const DEFAULT_TOKEN_SUPPLY: BigNumber = BigNumber.from(1000000000);
const DEFAULT_TOKEN_SUPPLY_PER_ACCOUNT: BigNumber = BigNumber.from(1000);
// must be between 0 and 100!
const DEFAULT_REFERRAL_PERCENTAGE: PercentageType = 30;
const DEFAULT_REFEREE_PERCENTAGE: PercentageType = 40;
// number of payment transactions for a referral process to be complete = thresholds + 1
const DEFAULT_QUANTITY_THRESHOLD: BigNumber = BigNumber.from(2);
const DEFAULT_VALUE_THRESHOLD: BigNumber = BigNumber.from(100);
const DEFAULT_MAX_REWARD_LEVEL: BigNumber = BigNumber.from(4);

const testDescribeTitle = `Testing ${CONTRACT_NAME} Referral Contract`;
// noinspection DuplicatedCode
describe(testDescribeTitle, async () => {
  try {
    // get fixture function for testing
    const defaultFixture = async () => {
      return deployMultilevelTokenReferralRewardFixture<
        V1ReferralMultilevelTokenRewardsUpgradable,
        DEFAULT_TOKEN_TYPE
      >({
        tokenName: DEFAULT_TOKEN,
        initialTokenSupply: DEFAULT_TOKEN_SUPPLY,
        tokenSupplyPerAccount: DEFAULT_TOKEN_SUPPLY_PER_ACCOUNT,
        contractName: CONTRACT_NAME,
        referralPercentage: DEFAULT_REFERRAL_PERCENTAGE,
        refereePercentage: DEFAULT_REFEREE_PERCENTAGE,
        paymentQuantityThreshold: DEFAULT_QUANTITY_THRESHOLD,
        paymentValueThreshold: DEFAULT_VALUE_THRESHOLD,
        maxRewardLevels: DEFAULT_MAX_REWARD_LEVEL,
      });
    };

    // -----------------------------------------------------------------------------------------------
    // Testing Contract Deployment
    // -----------------------------------------------------------------------------------------------

    describe(`Testing Contract Deployment`, async () => {
      it(`${CONTRACT_NAME} should throw if deployed with incorrect referral reward param`, async () => {
        const [receiver] = await ethers.getSigners();

        // deploy token contract
        const TokenContract: ContractFactory = await ethers.getContractFactory(
          DEFAULT_TOKEN
        );
        const deployedTokenContract: Contract = await TokenContract.deploy(
          DEFAULT_TOKEN_SUPPLY
        );
        const tokenAddress: string = deployedTokenContract.address;

        const incorrectRewardPercentage: number = 105;
        const correctRewardPercentage: PercentageType = 60;

        const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

        const deployedProxyContractPromise = upgrades.deployProxy(
          referralContract,
          [
            tokenAddress,
            receiver.address,
            correctRewardPercentage,
            incorrectRewardPercentage,
            DEFAULT_QUANTITY_THRESHOLD,
            DEFAULT_VALUE_THRESHOLD,
            DEFAULT_MAX_REWARD_LEVEL,
          ]
        );
        await expect(deployedProxyContractPromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      });
      it(`${CONTRACT_NAME} should throw if deployed with incorrect referee reward param`, async () => {
        const [receiver] = await ethers.getSigners();
        // deploy token contract
        const TokenContract: ContractFactory = await ethers.getContractFactory(
          DEFAULT_TOKEN
        );
        const deployedTokenContract: Contract = await TokenContract.deploy(
          DEFAULT_TOKEN_SUPPLY
        );

        const tokenAddress: string = deployedTokenContract.address;

        const incorrectRewardPercentage: number = 105;
        const correctRewardPercentage: PercentageType = 50;

        const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

        const deployedProxyContractPromise = upgrades.deployProxy(
          referralContract,
          [
            tokenAddress,
            receiver.address,
            incorrectRewardPercentage,
            correctRewardPercentage,
            DEFAULT_QUANTITY_THRESHOLD,
            DEFAULT_VALUE_THRESHOLD,
            DEFAULT_MAX_REWARD_LEVEL,
          ]
        );
        await expect(deployedProxyContractPromise).to.be.rejectedWith(
          REWARD_PERCENTAGE_OUT_OF_BOUNDS
        );
      });
      it(`${CONTRACT_NAME} should throw if deployed with incorrect maxRewardLevels param`, async () => {
        const [receiver] = await ethers.getSigners();

        // deploy token contract
        const TokenContract: ContractFactory = await ethers.getContractFactory(
          DEFAULT_TOKEN
        );
        const deployedTokenContract: Contract = await TokenContract.deploy(
          DEFAULT_TOKEN_SUPPLY
        );
        const tokenAddress: string = deployedTokenContract.address;

        const incorrectMaxRewardLevelsParam: number = 0;
        const correctRewardPercentage: PercentageType = 50;

        const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

        const deployedProxyContractPromise = upgrades.deployProxy(
          referralContract,
          [
            tokenAddress,
            receiver.address,
            correctRewardPercentage,
            correctRewardPercentage,
            DEFAULT_QUANTITY_THRESHOLD,
            DEFAULT_VALUE_THRESHOLD,
            incorrectMaxRewardLevelsParam,
          ]
        );
        await expect(deployedProxyContractPromise).to.be.rejectedWith(
          MIN_REWARD_LEVELS
        );
      });
      it(`${CONTRACT_NAME} should throw if deployed with zero address for receiver`, async () => {
        const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

        // deploy token contract
        const TokenContract: ContractFactory = await ethers.getContractFactory(
          DEFAULT_TOKEN
        );
        const deployedTokenContract: Contract = await TokenContract.deploy(
          DEFAULT_TOKEN_SUPPLY
        );

        const tokenAddress: string = deployedTokenContract.address;

        const deployedProxyContractPromise = upgrades.deployProxy(
          referralContract,
          [
            tokenAddress,
            constants.AddressZero,
            DEFAULT_REFERRAL_PERCENTAGE,
            DEFAULT_REFEREE_PERCENTAGE,
            DEFAULT_QUANTITY_THRESHOLD,
            DEFAULT_VALUE_THRESHOLD,
            DEFAULT_MAX_REWARD_LEVEL,
          ]
        );
        await expect(deployedProxyContractPromise).to.be.rejectedWith(
          NON_ZERO_ADDRESS
        );
      });
      it(`${CONTRACT_NAME} should throw if deployed with invalid token address`, async () => {
        const referralContract = await ethers.getContractFactory(CONTRACT_NAME);

        const deployedProxyContractPromise = upgrades.deployProxy(
          referralContract,
          [
            constants.AddressZero,
            constants.AddressZero,
            DEFAULT_REFERRAL_PERCENTAGE,
            DEFAULT_REFEREE_PERCENTAGE,
            DEFAULT_QUANTITY_THRESHOLD,
            DEFAULT_VALUE_THRESHOLD,
            DEFAULT_MAX_REWARD_LEVEL,
          ]
        );
        await expect(deployedProxyContractPromise).to.be.rejectedWith(
          NON_ZERO_ADDRESS
        );
      });
    });

    // -----------------------------------------------------------------------------------------------
    // Testing Updating Contract Values
    // -----------------------------------------------------------------------------------------------

    describe(`Testing Updating Contract Values`, async () => {
      it(`${CONTRACT_NAME} should update receiver address`, async () => {
        const { admin, updatedReceiver, proxyContract } = await loadFixture(
          defaultFixture
        );
        // assert address are not the same at the start
        const initialAddress: string = await proxyContract.receiverAddress();
        const updateAddress: string = await updatedReceiver.getAddress();
        expect(initialAddress).to.not.equal(updateAddress);
        // update receiver address
        await proxyContract.connect(admin).updateReceiverAddress(updateAddress);
        const contractReceiverAddress: string =
          await proxyContract.receiverAddress();
        // assert address is updated
        expect(updateAddress).to.equal(contractReceiverAddress);
      });

      it(`${CONTRACT_NAME} should throw if updated receiver address is 0`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with invalid and outbound boundary values
        const invalidUpdateValues: string[] = [constants.AddressZero];
        // update values and assert update fails
        for (const updatedValue of invalidUpdateValues) {
          const referralRewardUpdatePromise = proxyContract
            .connect(admin)
            .updateReceiverAddress(updatedValue);
          await expect(referralRewardUpdatePromise).to.be.rejectedWith(
            NON_ZERO_ADDRESS
          );
        }
      });

      it(`${CONTRACT_NAME} should update referral reward percentage`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with regular and inbound boundary values
        const validUpdateValues: PercentageType[] = [0, 20, 100];
        // update values and assert they are updated
        for (const updatedValue of validUpdateValues) {
          await proxyContract.connect(admin).updateReferralReward(updatedValue);
          const contractValue = await proxyContract.rewardPercentage();
          expect(contractValue).to.equal(updatedValue);
        }
      });
      it(`${CONTRACT_NAME} should throw if updated referral reward percentage is not between 0 and 100`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with invalid and outbound boundary values
        const invalidUpdateValues: number[] = [101, 500];
        // update values and assert update fails
        for (const updatedValue of invalidUpdateValues) {
          const referralRewardUpdatePromise = proxyContract
            .connect(admin)
            .updateReferralReward(updatedValue);
          await expect(referralRewardUpdatePromise).to.be.rejectedWith(
            REWARD_PERCENTAGE_OUT_OF_BOUNDS
          );
        }
      });

      it(`${CONTRACT_NAME} should update referee reward percentage`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with regular and inbound boundary values
        const validUpdateValues: PercentageType[] = [0, 20, 100];
        // update values and assert they are updated
        for (const updatedValue of validUpdateValues) {
          await proxyContract.connect(admin).updateRefereeReward(updatedValue);
          const contractValue = await proxyContract.refereeRewardPercentage();
          expect(contractValue).to.equal(updatedValue);
        }
      });
      it(`${CONTRACT_NAME} should throw if updated referee reward percentage is not between 0 and 100`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with invalid and outbound boundary values
        const invalidUpdateValues: number[] = [101, 500];
        // update values and assert update fails
        for (const updatedValue of invalidUpdateValues) {
          const updatePromise = proxyContract
            .connect(admin)
            .updateRefereeReward(updatedValue);
          await expect(updatePromise).to.be.rejectedWith(
            REWARD_PERCENTAGE_OUT_OF_BOUNDS
          );
        }
      });

      it(`${CONTRACT_NAME} should update payments quantity threshold`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with regular and inbound boundary values
        const validUpdateValues: BigNumber[] = [
          BigNumber.from(1),
          BigNumber.from(5),
          BigNumber.from(10),
        ];
        // update values and assert they are updated
        for (const updatedValue of validUpdateValues) {
          await proxyContract
            .connect(admin)
            .updatePaymentsQuantityThreshold(updatedValue);
          const contractValue = await proxyContract.paymentsQuantityThreshold();
          expect(contractValue).to.equal(updatedValue);
        }
      });
      it(`${CONTRACT_NAME} should update payments value threshold`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with regular and inbound boundary values
        const validUpdateValues: BigNumber[] = [
          BigNumber.from(10),
          BigNumber.from(50),
          BigNumber.from(100),
        ];
        // update values and assert they are updated
        for (const updatedValue of validUpdateValues) {
          await proxyContract
            .connect(admin)
            .updatePaymentsValueThreshold(updatedValue);
          const contractValue = await proxyContract.paymentsValueThreshold();
          expect(contractValue).to.equal(updatedValue);
        }
      });
      it(`${CONTRACT_NAME} should update max reward levels`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with regular and inbound boundary values
        const validUpdateValues: BigNumber[] = [
          BigNumber.from(4),
          BigNumber.from(8),
        ];
        // update values and assert they are updated
        for (const updatedValue of validUpdateValues) {
          await proxyContract
            .connect(admin)
            .updateMaxRewardLevels(updatedValue);
          const contractValue = await proxyContract.maxRewardLevels();
          expect(contractValue).to.equal(updatedValue);
        }
      });

      it(`${CONTRACT_NAME} should throw if updated max reward levels is 0`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);
        // test with invalid and outbound boundary values
        const invalidUpdateValues: number[] = [0];
        // update values and assert update fails
        for (const updatedValue of invalidUpdateValues) {
          const updatePromise = proxyContract
            .connect(admin)
            .updateMaxRewardLevels(updatedValue);
          await expect(updatePromise).to.be.rejectedWith(MIN_REWARD_LEVELS);
        }
      });

      it(`${CONTRACT_NAME} should update reward token`, async () => {
        const { admin, proxyContract } = await loadFixture(defaultFixture);

        // deploy second erc20 token
        const TokenContract = await ethers.getContractFactory("TwinDeferral");
        const deployedToken: TwinDeferral = (await TokenContract.deploy(
          DEFAULT_TOKEN_SUPPLY
        )) as TwinDeferral;
        const updatedTokenAddress: string = deployedToken.address;

        // update values and assert they are updated
        await proxyContract
          .connect(admin)
          .updateReferralToken(updatedTokenAddress);
        const token = await proxyContract.token();
        expect(token).to.equal(updatedTokenAddress);
      });
    });

    // -----------------------------------------------------------------------------------------------
    // Testing Function Modifiers
    // -----------------------------------------------------------------------------------------------

    describe(`Testing Function Modifiers`, async () => {
      it(`${CONTRACT_NAME} should throw if non-admin tries to update contract`, async () => {
        const { rootReferrer, updatedReceiver, proxyContract } =
          await loadFixture(defaultFixture);

        // deploy token contract
        const TokenContract: ContractFactory = await ethers.getContractFactory(
          DEFAULT_TOKEN
        );
        const deployedTokenContract: Contract = await TokenContract.deploy(
          DEFAULT_TOKEN_SUPPLY
        );

        // get valid values for updating
        const tokenAddress: string = deployedTokenContract.address;
        const nonAdminSigner: SignerWithAddress = rootReferrer;
        const validReferralReward: PercentageType = 50;
        const validRefereeReward: PercentageType = 40;
        const validReceiverAddress: string = await updatedReceiver.getAddress();
        const validPaymentQuantity: BigNumber = BigNumber.from(100);
        const validPaymentsValue: BigNumber = BigNumber.from(50);
        const validMaxRewardLevels: BigNumber = BigNumber.from(20);
        const expectedError: string = OWNABLE_ERROR_STRING;

        // execute tx with valid values and non-admin signer
        const tokenUpdatedPromise = proxyContract
          .connect(nonAdminSigner)
          .updateReferralToken(tokenAddress);
        const referralRewardUpdatePromise = proxyContract
          .connect(nonAdminSigner)
          .updateReferralReward(validReferralReward);
        const refereeRewardUpdatePromise = proxyContract
          .connect(nonAdminSigner)
          .updateRefereeReward(validRefereeReward);
        const receiverAddressUpdatePromise = proxyContract
          .connect(nonAdminSigner)
          .updateReceiverAddress(validReceiverAddress);
        const paymentsQuantityUpdatePromise = proxyContract
          .connect(nonAdminSigner)
          .updatePaymentsQuantityThreshold(validPaymentQuantity);
        const paymentsValueUpdatePromise = proxyContract
          .connect(nonAdminSigner)
          .updatePaymentsQuantityThreshold(validPaymentsValue);
        const maxRewardLevelsUpdatePromise = proxyContract
          .connect(nonAdminSigner)
          .updateMaxRewardLevels(validMaxRewardLevels);
        // await tx calls to be rejected since they are not owner of the contract
        await expect(tokenUpdatedPromise).to.be.rejectedWith(expectedError);
        await expect(referralRewardUpdatePromise).to.be.rejectedWith(
          expectedError
        );
        await expect(refereeRewardUpdatePromise).to.be.rejectedWith(
          expectedError
        );
        await expect(receiverAddressUpdatePromise).to.be.rejectedWith(
          expectedError
        );
        await expect(paymentsQuantityUpdatePromise).to.be.rejectedWith(
          expectedError
        );
        await expect(paymentsValueUpdatePromise).to.be.rejectedWith(
          expectedError
        );
        await expect(maxRewardLevelsUpdatePromise).to.be.rejectedWith(
          expectedError
        );
      });
    });

    // -----------------------------------------------------------------------------------------------
    // Testing Referral Process Functionality
    // -----------------------------------------------------------------------------------------------

    const testingReferralProcessDescribeTitle = `Testing Referral Process Functionality`;
    describe(testingReferralProcessDescribeTitle, async () => {
      try {
        // referral conditions for process testing
        const ptPaymentValue: BigNumber = BigNumber.from(10);
        const ptReferralPercentage: PercentageType = 11;
        const ptRefereePercentage: PercentageType = 50;
        const ptPaymentsValueThreshold: BigNumber = BigNumber.from(100);
        const ptPaymentsQuantityThreshold: BigNumber = BigNumber.from(5);
        const ptMaxRewardLevels: BigNumber = BigNumber.from(2);

        // get fixture function for testing
        const processTestingFixture = async () => {
          return deployMultilevelTokenReferralRewardFixture<
            V1ReferralMultilevelTokenRewardsUpgradable,
            DEFAULT_TOKEN_TYPE
          >({
            tokenName: DEFAULT_TOKEN,
            initialTokenSupply: DEFAULT_TOKEN_SUPPLY,
            tokenSupplyPerAccount: DEFAULT_TOKEN_SUPPLY_PER_ACCOUNT,
            contractName: CONTRACT_NAME,
            referralPercentage: ptReferralPercentage,
            refereePercentage: ptRefereePercentage,
            paymentQuantityThreshold: ptPaymentsQuantityThreshold,
            paymentValueThreshold: ptPaymentsValueThreshold,
            maxRewardLevels: ptMaxRewardLevels,
          });
        };

        it(`${CONTRACT_NAME} should throw if sender/referee is referrer`, async () => {
          const { referee, proxyContract } = await loadFixture(
            processTestingFixture
          );

          // register referee with root referrer as referee
          const refereePaymentTxPromise = proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              referee.address,
              ptPaymentValue
            );

          // await calls to be rejected since referral has been completed
          await expect(refereePaymentTxPromise).to.be.rejectedWith(
            SENDER_CANNOT_BE_REFERRER
          );
        });

        it(`${CONTRACT_NAME} should register payment of new address with no referrer as root referrer`, async () => {
          const { rootReferrer, proxyContract } = await loadFixture(
            processTestingFixture
          );

          // execute root referrer payment with no referrer param --> registers address as root
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          const rootReferrerMapping = await proxyContract.refereeProcessMapping(
            rootReferrer.address
          );

          // assert root referrer data is updated and registered correctly
          expect(rootReferrerMapping.isRoot).to.equal(true);
          expect(rootReferrerMapping.referralProcessCompleted).to.equal(false);
          expect(rootReferrerMapping.referrerAddressHasBeenSet).to.equal(false);
          expect(rootReferrerMapping.parentReferrerAddress).to.equal(
            ethers.constants.AddressZero
          );
          expect(rootReferrerMapping.paymentsValue).to.equal(ptPaymentValue);
          expect(rootReferrerMapping.paymentsQuantity).to.equal(1);
        });

        it(`${CONTRACT_NAME} should register payment of registered referee with empty referrer param correctly`, async () => {
          const { rootReferrer, referee, proxyContract } = await loadFixture(
            processTestingFixture
          );
          // register root referrer
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);
          // register referee with root referrer as referee
          await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );
          const refereeProcessMapping =
            await proxyContract.refereeProcessMapping(referee.address);
          // assert data is updated correctly
          expect(refereeProcessMapping.referralProcessCompleted).to.equal(
            false
          );
          expect(refereeProcessMapping.referrerAddressHasBeenSet).to.equal(
            true
          );
          expect(refereeProcessMapping.parentReferrerAddress).to.equal(
            rootReferrer.address
          );
          expect(refereeProcessMapping.paymentsValue).to.be.equal(
            ptPaymentValue
          );
          expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

          // register another referee payment with empty referral address param
          await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );

          const updatedRefereeProcessMapping =
            await proxyContract.refereeProcessMapping(referee.address);

          // assert data is updated correctly
          expect(
            updatedRefereeProcessMapping.referralProcessCompleted
          ).to.equal(false);
          expect(
            updatedRefereeProcessMapping.referrerAddressHasBeenSet
          ).to.equal(true);
          expect(updatedRefereeProcessMapping.parentReferrerAddress).to.equal(
            rootReferrer.address
          );
          expect(updatedRefereeProcessMapping.paymentsValue).to.equal(
            ptPaymentValue.mul(2)
          );
          expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
        });

        it(`${CONTRACT_NAME} should register payment of registered referee with different registered referrer correctly (referrer address cannot be changed)`, async () => {
          const { rootReferrer, rootReferrer2, referee, proxyContract } =
            await loadFixture(processTestingFixture);
          // register root referrer
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);
          await proxyContract
            .connect(rootReferrer2)
            ["registerReferralPayment(uint256)"](ptPaymentValue);
          // register referee with root referrer as referee
          await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );
          const refereeProcessMapping =
            await proxyContract.refereeProcessMapping(referee.address);
          // assert data is updated correctly
          expect(refereeProcessMapping.referralProcessCompleted).to.equal(
            false
          );
          expect(refereeProcessMapping.referrerAddressHasBeenSet).to.equal(
            true
          );
          expect(refereeProcessMapping.parentReferrerAddress).to.equal(
            rootReferrer.address
          );
          expect(refereeProcessMapping.paymentsValue).to.equal(ptPaymentValue);
          expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

          // register another referee payment with different registered referral address param
          await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer2.address,
              ptPaymentValue
            );
          const updatedRefereeProcessMapping =
            await proxyContract.refereeProcessMapping(referee.address);
          // assert data is updated correctly
          expect(
            updatedRefereeProcessMapping.referralProcessCompleted
          ).to.equal(false);
          expect(
            updatedRefereeProcessMapping.referrerAddressHasBeenSet
          ).to.equal(true);
          expect(updatedRefereeProcessMapping.parentReferrerAddress).to.equal(
            rootReferrer.address
          );
          expect(updatedRefereeProcessMapping.paymentsValue).to.equal(
            ptPaymentValue.mul(2)
          );
          expect(updatedRefereeProcessMapping.paymentsQuantity).to.equal(2);
        });

        it(`${CONTRACT_NAME} should register payment of referee with higher level referee and update data correctly`, async () => {
          const { rootReferrer, referee, referee2, proxyContract } =
            await loadFixture(processTestingFixture);
          // register root referrer
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);
          // register referee with root referrer as referee
          await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );
          const refereeProcessMapping =
            await proxyContract.refereeProcessMapping(referee.address);
          // assert data is updated correctly
          expect(refereeProcessMapping.referralProcessCompleted).to.equal(
            false
          );
          expect(refereeProcessMapping.referrerAddressHasBeenSet).to.equal(
            true
          );
          expect(refereeProcessMapping.parentReferrerAddress).to.equal(
            rootReferrer.address
          );
          expect(refereeProcessMapping.paymentsValue).to.equal(ptPaymentValue);
          expect(refereeProcessMapping.paymentsQuantity).to.equal(1);

          // register new referee with higher level referee as referrer
          await proxyContract
            .connect(referee2)
            ["registerReferralPayment(address,uint256)"](
              referee.address,
              ptPaymentValue
            );
          const referee2ProcessMapping =
            await proxyContract.refereeProcessMapping(referee2.address);
          // assert data is updated correctly
          expect(referee2ProcessMapping.referralProcessCompleted).to.equal(
            false
          );
          expect(referee2ProcessMapping.referrerAddressHasBeenSet).to.equal(
            true
          );
          expect(referee2ProcessMapping.parentReferrerAddress).to.equal(
            referee.address
          );
          expect(referee2ProcessMapping.paymentsValue).to.equal(ptPaymentValue);
          expect(referee2ProcessMapping.paymentsQuantity).to.equal(1);
        });

        it(`${CONTRACT_NAME} should throw if referrer address 0`, async () => {
          const { referee, proxyContract } = await loadFixture(
            processTestingFixture
          );

          // register referee with root referrer as referee
          const refereePaymentTxPromise = proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              constants.AddressZero,
              ptPaymentValue
            );

          // await calls to be rejected since referral has been completed
          await expect(refereePaymentTxPromise).to.be.rejectedWith(
            NON_ZERO_ADDRESS
          );
        });

        it(`${CONTRACT_NAME} should throw if referrer address is not registered as referee or root referrer`, async () => {
          const { rootReferrer, referee, proxyContract } = await loadFixture(
            processTestingFixture
          );

          // register referee with root referrer as referee
          const refereePaymentTxPromise = proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );

          // await calls to be rejected since referral has been completed
          await expect(refereePaymentTxPromise).to.be.rejectedWith(
            REFERRER_IS_NOT_REGISTERED
          );
        });

        it(`${CONTRACT_NAME} should throw if registered root referrer tries to register as referee `, async () => {
          const { rootReferrer, rootReferrer2, proxyContract } =
            await loadFixture(processTestingFixture);

          // register root referrers
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);
          await proxyContract
            .connect(rootReferrer2)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          // try register root referrer with other referrer address
          const rootAsRefereePaymentTx = proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer2.address,
              ptPaymentValue
            );

          // await calls to be rejected since referral has been completed
          await expect(rootAsRefereePaymentTx).to.be.rejectedWith(
            ROOT_ADDRESS_CANNOT_BE_REFEREE
          );
        });

        it(`${CONTRACT_NAME} should forward root referrer payment correctly`, async () => {
          const { receiver, rootReferrer, proxyContract } = await loadFixture(
            processTestingFixture
          );
          const initialRootReferrerBalance: BigNumber =
            await rootReferrer.getBalance();
          const initialReceiverBalance: BigNumber = await receiver.getBalance();

          // root referrer payment registers address as root
          const rootReferrerPaymentTx = await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          // calculate referral transaction costs
          const txCost: BigNumber = await getTransactionCosts(
            rootReferrerPaymentTx
          );

          // calculate result values
          const finalContractBalance: BigNumber =
            await proxyContract.getBalance();
          const afterReceiverBalance: BigNumber = await receiver.getBalance();
          const afterRootReferrerBalance: BigNumber =
            await rootReferrer.getBalance();

          // assert balances are correct
          expect(afterReceiverBalance).to.be.closeTo(
            initialReceiverBalance.add(ptPaymentValue),
            TEST_PRECISION_DELTA
          );
          expect(afterRootReferrerBalance).to.be.closeTo(
            initialRootReferrerBalance.sub(ptPaymentValue).sub(txCost),
            TEST_PRECISION_DELTA
          );
          expect(finalContractBalance).to.equal(0);
        });

        it(`${CONTRACT_NAME} should forward multiple root referrer payments and update data correctly`, async () => {
          const { receiver, rootReferrer, proxyContract } = await loadFixture(
            processTestingFixture
          );

          // register root referrer with payment
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          const initialRootReferrerBalance: BigNumber =
            await rootReferrer.getBalance();
          const initialReceiverBalance: BigNumber = await receiver.getBalance();

          // second root referrer payment
          const rootReferrerPaymentTx = await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);
          // calculate referral transaction costs
          const txCost: BigNumber = await getTransactionCosts(
            rootReferrerPaymentTx
          );

          // calculate result values
          const rootReferrerMapping = await proxyContract.refereeProcessMapping(
            rootReferrer.address
          );
          const finalContractBalance: BigNumber =
            await proxyContract.getBalance();
          const afterReceiverBalance: BigNumber = await receiver.getBalance();
          const afterRootReferrerBalance: BigNumber =
            await rootReferrer.getBalance();

          // assert balances are correct
          expect(afterReceiverBalance).to.be.closeTo(
            initialReceiverBalance.add(ptPaymentValue),
            TEST_PRECISION_DELTA
          );
          expect(afterRootReferrerBalance).to.be.closeTo(
            initialRootReferrerBalance.sub(ptPaymentValue).sub(txCost),
            TEST_PRECISION_DELTA
          );
          expect(finalContractBalance).to.equal(0);

          // assert root referrer data is updated and registered correctly
          expect(rootReferrerMapping.isRoot).to.equal(true);
          expect(rootReferrerMapping.referralProcessCompleted).to.equal(false);
          expect(rootReferrerMapping.referrerAddressHasBeenSet).to.equal(false);
          expect(rootReferrerMapping.parentReferrerAddress).to.equal(
            ethers.constants.AddressZero
          );
          expect(rootReferrerMapping.paymentsValue).to.equal(
            ptPaymentValue.mul(2)
          );
          expect(rootReferrerMapping.paymentsQuantity).to.equal(2);
        });

        it(`${CONTRACT_NAME} should forward referee payment with referrer address param correctly`, async () => {
          const { receiver, referee, rootReferrer, proxyContract } =
            await loadFixture(processTestingFixture);

          // root referrer payment registers address as root
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          const initialRefereeBalance: BigNumber = await referee.getBalance();
          const initialReceiverBalance: BigNumber = await receiver.getBalance();
          const initialContractValue: BigNumber =
            await proxyContract.getBalance();

          // execute referee payment with root referrer as referrer address
          const refereePaymentTx = await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );

          // calculate referral transaction costs
          const txCost: BigNumber = await getTransactionCosts(refereePaymentTx);

          // calculate result values
          const reward: BigNumber = ptPaymentValue
            .mul(ptReferralPercentage)
            .div(100);
          const receiverAmount: BigNumber = ptPaymentValue.sub(reward);

          const finalContractBalance: BigNumber =
            await proxyContract.getBalance();
          const afterReceiverBalance: BigNumber = await receiver.getBalance();
          const afterRefereeBalance: BigNumber = await referee.getBalance();

          // assert balances are correct
          expect(afterReceiverBalance).to.be.closeTo(
            initialReceiverBalance.add(receiverAmount),
            TEST_PRECISION_DELTA
          );
          expect(afterRefereeBalance).to.be.closeTo(
            initialRefereeBalance.sub(ptPaymentValue).sub(txCost),
            TEST_PRECISION_DELTA
          );
          expect(finalContractBalance).to.be.closeTo(
            initialContractValue.add(reward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should forward referee payment with empty referrer address param correctly`, async () => {
          const { receiver, referee, rootReferrer, proxyContract } =
            await loadFixture(processTestingFixture);

          // root referrer payment registers address as root
          await proxyContract
            .connect(rootReferrer)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          // execute referee payment to register referee as referee with root referrer
          await proxyContract
            .connect(referee)
            ["registerReferralPayment(address,uint256)"](
              rootReferrer.address,
              ptPaymentValue
            );

          const initialRefereeBalance: BigNumber = await referee.getBalance();
          const initialReceiverBalance: BigNumber = await receiver.getBalance();
          const initialContractValue: BigNumber =
            await proxyContract.getBalance();

          // execute referee payment empty address param
          const refereePaymentTx = await proxyContract
            .connect(referee)
            ["registerReferralPayment(uint256)"](ptPaymentValue);

          // calculate referral transaction costs
          const txCost: BigNumber = await getTransactionCosts(refereePaymentTx);

          // calculate result values
          const reward: BigNumber = ptPaymentValue
            .mul(ptReferralPercentage)
            .div(100);

          const receiverAmount: BigNumber = ptPaymentValue.sub(reward);

          const finalContractBalance: BigNumber =
            await proxyContract.getBalance();
          const afterReceiverBalance: BigNumber = await receiver.getBalance();
          const afterRefereeBalance: BigNumber = await referee.getBalance();

          // assert balances are correct
          expect(afterReceiverBalance).to.be.closeTo(
            initialReceiverBalance.add(receiverAmount),
            TEST_PRECISION_DELTA
          );
          expect(afterRefereeBalance).to.be.closeTo(
            initialRefereeBalance.sub(ptPaymentValue).sub(txCost),
            TEST_PRECISION_DELTA
          );
          expect(finalContractBalance).to.be.closeTo(
            initialContractValue.add(reward),
            TEST_PRECISION_DELTA
          );
        });
      } catch (error) {
        console.log(
          `\nSomething went wrong in: ${testingReferralProcessDescribeTitle}\nTest cases inside this describe clause were not executed (whether failed nor completed)\n`,
          error
        );
      }
    });

    // -----------------------------------------------------------------------------------------------
    // Testing Distributing Two-Sided Multilevel Referral Rewards with MaxRewardLevels
    // -----------------------------------------------------------------------------------------------

    const testingDistributingTwoSidedRewardsDescribeTitle = `Testing Distributing Two-Sided Multi Level Rewards Functionality`;
    describe(testingDistributingTwoSidedRewardsDescribeTitle, async () => {
      try {
        const rdPaymentValue: BigNumber = BigNumber.from(30);
        const rdReferralPercentage: PercentageType = 11;
        const rdRefereePercentage: PercentageType = 50;
        const rdPaymentsValueThreshold: BigNumber = rdPaymentValue;
        const rdPaymentsQuantityThreshold: BigNumber = BigNumber.from(1);
        const rdMaxRewardLevel: BigNumber = BigNumber.from(3);

        // get fixture function for testing
        const rewardDistributionFixture = async () => {
          return deployMultilevelTokenReferralRewardFixture<
            V1ReferralMultilevelTokenRewardsUpgradable,
            DEFAULT_TOKEN_TYPE
          >({
            tokenName: DEFAULT_TOKEN,
            initialTokenSupply: DEFAULT_TOKEN_SUPPLY,
            tokenSupplyPerAccount: DEFAULT_TOKEN_SUPPLY_PER_ACCOUNT,
            contractName: CONTRACT_NAME,
            referralPercentage: rdReferralPercentage,
            refereePercentage: rdRefereePercentage,
            paymentQuantityThreshold: rdPaymentsQuantityThreshold,
            paymentValueThreshold: rdPaymentsValueThreshold,
            maxRewardLevels: rdMaxRewardLevel,
          });
        };

        // -----------------------------------------------------------------------------------------------
        // Testing Referral Completion and Reward Payments
        // -----------------------------------------------------------------------------------------------

        it(`${CONTRACT_NAME} should distribute 1-level two-sided rewards correctly after referee completed referral process`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for referee 1
          await chain.proxyContract
            .connect(chain.referee)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          const numberOfRewardLevels: BigNumber = BigNumber.from(1);

          const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(rdRefereePercentage);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractRewardProportion: BigNumber =
            rdPaymentValue.mul(rdReferralPercentage).div(100);

          const afterRefereeBalance: BigNumber = await token.balanceOf(
            chain.referee.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // calculate reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(rdReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(rdRefereePercentage)
            .div(100);
          // reward for all referrers along the chain
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE -->  referee 1
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance
              .sub(rdPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS

          // root referrer
          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance.add(
              expectedReferrerRewardProportion
            ),
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractRewardProportion)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should distribute 2-level rewards correctly after referee completed referral process`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for referee 2
          await chain.proxyContract
            .connect(chain.referee2)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          const numberOfRewardLevels: BigNumber = BigNumber.from(2);

          const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(rdRefereePercentage);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractRewardProportion: BigNumber =
            rdPaymentValue.mul(rdReferralPercentage).div(100);

          // account balances
          const afterReferee2Balance: BigNumber = await token.balanceOf(
            referee2.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // calculate reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(rdReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(rdRefereePercentage)
            .div(100);
          // reward for all referrers along the chain
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE -->  referee 2
          expect(afterReferee2Balance).to.be.closeTo(
            chain.initialReferee2Balance
              .sub(rdPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS

          // root referrer
          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance.add(
              expectedReferrerRewardProportion
            ),
            TEST_PRECISION_DELTA
          );

          // referee 1
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractRewardProportion)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should distribute 3-level rewards correctly after referee completed referral process`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for referee 3
          await chain.proxyContract
            .connect(chain.referee3)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          const numberOfRewardLevels: BigNumber = BigNumber.from(3);

          const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(rdRefereePercentage);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractRewardProportion: BigNumber =
            rdPaymentValue.mul(rdReferralPercentage).div(100);

          // account balances
          const afterReferee3Balance: BigNumber = await token.balanceOf(
            referee3.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterReferee2Balance: BigNumber = await token.balanceOf(
            referee2.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // calculate reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(rdReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(rdRefereePercentage)
            .div(100);
          // reward for all referrers along the chain
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE -->  referee 3
          expect(afterReferee3Balance).to.be.closeTo(
            chain.initialReferee3Balance
              .sub(rdPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS

          // root referrer
          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance.add(
              expectedReferrerRewardProportion
            ),
            TEST_PRECISION_DELTA
          );

          // referee 1
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );

          // referee2
          expect(afterReferee2Balance).to.be.closeTo(
            chain.initialReferee2Balance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractRewardProportion)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should distribute 4-level rewards correctly after referee completed referral process`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for referee 4
          await chain.proxyContract
            .connect(chain.referee4)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          // still 3 since rdMaxRewardLevel is 3 as well!!!
          const numberOfRewardLevels: BigNumber = BigNumber.from(3);

          const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(rdRefereePercentage);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractRewardProportion: BigNumber =
            rdPaymentValue.mul(rdReferralPercentage).div(100);

          // account balances
          const afterReferee4Balance: BigNumber = await token.balanceOf(
            referee4.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterReferee2Balance: BigNumber = await token.balanceOf(
            referee2.address
          );
          const afterReferee3Balance: BigNumber = await token.balanceOf(
            referee3.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // calculate reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(rdReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(rdRefereePercentage)
            .div(100);
          // reward for all referrers along the chain
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE --> referee 4
          expect(afterReferee4Balance).to.be.closeTo(
            chain.initialReferee4Balance
              .sub(rdPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS

          // referee1
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );

          // referee2
          expect(afterReferee2Balance).to.be.closeTo(
            chain.initialReferee2Balance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );
          // referee3
          expect(afterReferee3Balance).to.be.closeTo(
            chain.initialReferee3Balance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );

          // OUT OF BOUND REWARD LEVELS REFERRERS --> will not receive rewards since they are over the max level
          // root referrer
          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance,
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractRewardProportion)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should distribute 5-level (final referee) rewards correctly after referee completed referral process`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for final referee
          await chain.proxyContract
            .connect(chain.finalReferee)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          // still 3 since rdMaxRewardLevel is 3 as well!!!
          const numberOfRewardLevels: BigNumber = BigNumber.from(3);

          const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(rdRefereePercentage);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractRewardProportion: BigNumber =
            rdPaymentValue.mul(rdReferralPercentage).div(100);

          // account balances
          const afterFinalRefereeBalance: BigNumber = await token.balanceOf(
            finalReferee.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterReferee2Balance: BigNumber = await token.balanceOf(
            referee2.address
          );
          const afterReferee3Balance: BigNumber = await token.balanceOf(
            referee3.address
          );
          const afterReferee4Balance: BigNumber = await token.balanceOf(
            referee4.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // calculate reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(rdReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(rdRefereePercentage)
            .div(100);
          // reward for all referrers along the chain
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE --> final referee
          expect(afterFinalRefereeBalance).to.be.closeTo(
            chain.initialFinalRefereeBalance
              .sub(rdPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS
          // referee2
          expect(afterReferee2Balance).to.be.closeTo(
            chain.initialReferee2Balance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );
          // referee3
          expect(afterReferee3Balance).to.be.closeTo(
            chain.initialReferee3Balance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );
          // referee4
          expect(afterReferee4Balance).to.be.closeTo(
            chain.initialReferee4Balance.add(expectedReferrerRewardProportion),
            TEST_PRECISION_DELTA
          );

          // OUT OF BOUND REWARD LEVELS REFERRERS --> will not receive rewards since they are over the max level
          // root referrer
          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance,
            TEST_PRECISION_DELTA
          );
          // referee 1
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance,
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractRewardProportion)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should distribute multiple (1-level & 2-level) rewards correctly after referees completed referral processes`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for referee 1
          await chain.proxyContract
            .connect(chain.referee)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          const initialAfterCompletionPaymentRefereeBalance =
            await token.balanceOf(referee.address);

          // complete referral process for referee 2
          await chain.proxyContract
            .connect(chain.referee2)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          // calculate result values
          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(rdRefereePercentage);
          const registeredPaidValue: BigNumber = rdPaymentValue.mul(2);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractRewardProportion: BigNumber =
            rdPaymentValue.mul(rdReferralPercentage).div(100);

          // account balances
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );
          // reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(rdReferralPercentage)
            .div(100);
          // reward for all referrers along the chain
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);

          const firstLevelRewardProportion: BigNumber = expectedReferrerReward;
          const secondLevelRewardProportion: BigNumber =
            expectedReferrerReward.div(2);

          // assert reward has been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // root referrer receives 2x rewards since both referee1 and referee2 have completed process
          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance
              .add(firstLevelRewardProportion)
              .add(secondLevelRewardProportion),
            TEST_PRECISION_DELTA
          );

          // referee should receive rewards also if they have completed the process
          expect(afterRefereeBalance).to.be.closeTo(
            initialAfterCompletionPaymentRefereeBalance.add(
              secondLevelRewardProportion
            ),
            TEST_PRECISION_DELTA
          );

          // contract --> initial contract balance + 2x completion payment reward amount that was received -  2x distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractRewardProportion.mul(2))
              .sub(expectedTotalPaidOutReward.mul(2)),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should throw if referee with completed process wants to register payment`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(rewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: rdPaymentValue,
            token,
          });

          // complete referral process for referee 1
          await chain.proxyContract
            .connect(chain.referee)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          const completedRefereePaymentTxPromise = chain.proxyContract
            .connect(referee)
            ["registerReferralPayment(uint256)"](rdPaymentValue);

          // await calls to be rejected since referral has been completed
          await expect(completedRefereePaymentTxPromise).to.be.rejectedWith(
            REFERRAL_PROCESS_MUST_NOT_BE_COMPLETED
          );
        });
      } catch (error) {
        console.log(
          `\nSomething went wrong in: ${testingDistributingTwoSidedRewardsDescribeTitle}\nTest cases inside this describe clause were not executed (whether failed nor completed)\n`,
          error
        );
      }
    });

    // -----------------------------------------------------------------------------------------------
    // Testing Special Cases for Referral Completion and Reward Payments
    // -----------------------------------------------------------------------------------------------

    const testingSpecialCasesDescribeTitle = `Testing Special Cases for Two-Sided Rewards`;
    describe(testingSpecialCasesDescribeTitle, async () => {
      try {
        // referral conditions ONE SIDED Rewards
        const tsPaymentValue: BigNumber = BigNumber.from(10);
        const tsReferralPercentage: PercentageType = 20;
        const tsRefereePercentage: PercentageType = 0;
        const tsPaymentsValueThreshold: BigNumber = tsPaymentValue;
        const tsPaymentsQuantityThreshold: BigNumber = BigNumber.from(1);
        const tsMaxRewardLevel: BigNumber = BigNumber.from(1);

        // get fixture function for testing
        const twoSidedRewardDistributionFixture = async () => {
          return deployMultilevelTokenReferralRewardFixture<
            V1ReferralMultilevelTokenRewardsUpgradable,
            DEFAULT_TOKEN_TYPE
          >({
            tokenName: DEFAULT_TOKEN,
            initialTokenSupply: DEFAULT_TOKEN_SUPPLY,
            tokenSupplyPerAccount: DEFAULT_TOKEN_SUPPLY_PER_ACCOUNT,
            contractName: CONTRACT_NAME,
            referralPercentage: tsReferralPercentage,
            refereePercentage: tsRefereePercentage,
            paymentQuantityThreshold: tsPaymentsQuantityThreshold,
            paymentValueThreshold: tsPaymentsValueThreshold,
            maxRewardLevels: tsMaxRewardLevel,
          });
        };

        it(`${CONTRACT_NAME} should distribute 1-level one-sided rewards only to referrer`, async () => {
          const {
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(twoSidedRewardDistributionFixture);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: tsPaymentValue,
            token,
          });

          // complete referral process for referee 1
          await chain.proxyContract
            .connect(chain.referee)
            ["registerReferralPayment(uint256)"](tsPaymentValue);

          // calculate result values
          const numberOfRewardLevels: BigNumber = BigNumber.from(1);
          const registeredPaidValue: BigNumber = tsPaymentValue.mul(2);

          const referrerPercentage: BigNumber =
            BigNumber.from(100).sub(tsRefereePercentage);

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractReward: BigNumber = tsPaymentValue
            .mul(tsReferralPercentage)
            .div(100);

          // account balances
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(tsReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(tsRefereePercentage)
            .div(100);
          // reward for all referrers
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE --> referee reward is 0% --> 0
          expect(expectedRefereeReward).to.be.closeTo(0, TEST_PRECISION_DELTA);
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance
              .sub(tsPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS

          // root referrer reward is 100% of total reward
          expect(expectedTotalPaidOutReward).to.be.closeTo(
            expectedReferrerRewardProportion,
            TEST_PRECISION_DELTA
          );
          expect(expectedTotalPaidOutReward).to.be.closeTo(
            expectedReferrerReward,
            TEST_PRECISION_DELTA
          );

          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance.add(
              expectedReferrerRewardProportion
            ),
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractReward)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });

        it(`${CONTRACT_NAME} should distribute 1-level one-sided rewards only to referee`, async () => {
          const {
            admin,
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            token,
          } = await loadFixture(twoSidedRewardDistributionFixture);

          // update referee percentage to be 100%
          const updatedRefereePercentage: PercentageType = 100;
          await proxyContract
            .connect(admin)
            .updateRefereeReward(updatedRefereePercentage);

          // create referral chain payments
          const chain = await createTokenReferralChain<DEFAULT_TOKEN_TYPE>({
            rootReferrer,
            referee,
            referee2,
            referee3,
            referee4,
            finalReferee,
            proxyContract,
            paymentValue: tsPaymentValue,
            token,
          });

          // complete referral process for referee 1
          await chain.proxyContract
            .connect(chain.referee)
            ["registerReferralPayment(uint256)"](tsPaymentValue);

          // calculate result values
          const numberOfRewardLevels: BigNumber = BigNumber.from(1);
          const registeredPaidValue: BigNumber = tsPaymentValue.mul(2);

          const referrerPercentage: BigNumber = BigNumber.from(100).sub(
            updatedRefereePercentage
          );

          // proportion of the completion payment that stays on the reward contract
          const completionPaymentContractReward: BigNumber = tsPaymentValue
            .mul(tsReferralPercentage)
            .div(100);

          // account balances
          const afterRefereeBalance: BigNumber = await token.balanceOf(
            referee.address
          );
          const afterRootReferralBalance: BigNumber = await token.balanceOf(
            rootReferrer.address
          );
          const afterContractBalance: BigNumber = await token.balanceOf(
            proxyContract.address
          );

          // reward values
          const expectedTotalPaidOutReward: BigNumber = registeredPaidValue
            .mul(tsReferralPercentage)
            .div(100);
          // reward for referee
          const expectedRefereeReward: BigNumber = expectedTotalPaidOutReward
            .mul(updatedRefereePercentage)
            .div(100);
          // reward for all referrers
          const expectedReferrerReward: BigNumber = expectedTotalPaidOutReward
            .mul(referrerPercentage)
            .div(100);
          // reward for a single referrer
          const expectedReferrerRewardProportion: BigNumber =
            expectedReferrerReward.div(numberOfRewardLevels);

          // assert two-sided rewards have been paid out correctly to all parties after completion
          // -------------------------------------------------------------------------

          // REFEREE --> referee reward is 100% of total reward
          expect(expectedRefereeReward).to.be.closeTo(
            expectedTotalPaidOutReward,
            TEST_PRECISION_DELTA
          );
          expect(afterRefereeBalance).to.be.closeTo(
            chain.initialRefereeBalance
              .sub(tsPaymentValue)
              .add(expectedRefereeReward),
            TEST_PRECISION_DELTA
          );

          // REFERRERS

          // root referrer reward is 0% --> 0
          expect(expectedReferrerRewardProportion).to.be.closeTo(
            0,
            TEST_PRECISION_DELTA
          );
          expect(expectedReferrerReward).to.be.closeTo(0, TEST_PRECISION_DELTA);

          expect(afterRootReferralBalance).to.be.closeTo(
            chain.initialRootReferrerBalance.add(
              expectedReferrerRewardProportion
            ),
            TEST_PRECISION_DELTA
          );

          // CONTRACT --> initial contract balance + completion payment reward amount that was received - distributed rewards
          expect(afterContractBalance).to.be.closeTo(
            chain.initialContractBalance
              .add(completionPaymentContractReward)
              .sub(expectedTotalPaidOutReward),
            TEST_PRECISION_DELTA
          );
        });
      } catch (error) {
        console.log(
          `\nSomething went wrong in: ${testingSpecialCasesDescribeTitle}\nTest cases inside this describe clause were not executed (whether failed nor completed)\n`,
          error
        );
      }
    });
  } catch (error) {
    console.log(
      `\nSomething went wrong in: ${testDescribeTitle}\nTest cases inside this describe clause were not executed (whether failed nor completed)\n`,
      error
    );
  }
});
