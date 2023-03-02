import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethConverter } from "../helpers/converters";
import { V2UpgradableReferralPaymentProxy } from "../typechain-types";

describe("Upgradable Referral Proxy", async () => {
  // referral values / conditions (in ether)
  const PAYMENT_AMOUNT = 10;
  const REFERRAL_REWARD = 1;
  const PRICE = PAYMENT_AMOUNT - REFERRAL_REWARD;

  // helper function to deploy the referral contract
  async function deployUpgradableFixture() {
    const [admin, receiver, referrer, referee] = await ethers.getSigners();
    console.log("admin.address", admin.address, "");

    // const currentImplAddress = await getImplementationAddress(receiver, proxyAddress);

    const referralContract = await ethers.getContractFactory(
      "UpgradableReferralPaymentProxy"
    );

    // deploy upgrade proxy contract
    const proxyContract = await upgrades.deployProxy(referralContract, [
      receiver.address,
      ethConverter(PAYMENT_AMOUNT),
      ethConverter(REFERRAL_REWARD),
    ]);

    // admin of  the upgrade contracts
    const adminAddress = proxyContract.signer.getAddress();

    // proxy contract address
    const proxyContractAddress = await proxyContract.address;

    // current implementation contract address
    const currentImplementationContractAddress =
      await upgrades.erc1967.getImplementationAddress(proxyContract.address);

    // address of the proxy admin contract
    const proxyAdminContractAddress = await upgrades.erc1967.getAdminAddress(
      proxyContract.address
    );

    return {
      receiver,
      referrer,
      referee,
      proxyContract,
      currentImplementationContractAddress,
    };
  }

  it("upgrade works", async () => {
    const {
      receiver,
      referrer,
      referee,
      proxyContract,
      currentImplementationContractAddress,
    } = await loadFixture(deployUpgradableFixture);

    const upgradedImplementationContract = await ethers.getContractFactory(
      "V2UpgradableReferralPaymentProxy"
    );
    const Delegate = await ethers.getContractFactory(
      "V2UpgradableReferralPaymentProxy"
    );

    const deployedImplementationContract =
      await upgradedImplementationContract.deploy();
    await deployedImplementationContract.deployed();

    const upgradedProxyContract = await upgrades.upgradeProxy(
      proxyContract,
      upgradedImplementationContract
    );
    await upgradedProxyContract.deployed();

    const upgradedImplementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxyContract.address);

    console.log(
      "currentImplementationContractAddress",
      currentImplementationContractAddress,
      ""
    );
    // ADDRESS ONLY CHANGES IF THE CONTRACT CHANGES!!!!!!!!!

    console.log("upgradedImplementationAddress", upgradedImplementationAddress);

    // await referral process
    // await proxyContract
    //   .connect(referee)
    //   .forwardReferralPayment(referrer.address, {
    //     value: ethConverter(PAYMENT_AMOUNT),
    //   });

    const adder = deployedImplementationContract.attach(
      proxyContract.address
    ) as typeof deployedImplementationContract;

    const proxiedImplementation = await deployedImplementationContract.attach(
      proxyContract.address
    );

    // typed proxyContract
    const typedProxyContract =
      upgradedProxyContract as V2UpgradableReferralPaymentProxy;

    await typedProxyContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    await proxyContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    await upgradedProxyContract
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // await referral process
    await proxiedImplementation
      .connect(referee)
      .forwardReferralPayment(referrer.address, {
        value: ethConverter(PAYMENT_AMOUNT),
      });

    // FOR TESTING https://ethereum.stackexchange.com/questions/120787/testing-proxies-with-hardhat
    //
    // const V1 = await ethers.getContractFactory("V1");
    // const v1 = await V1.deploy();
    //
    // const Proxy = await ethers.getContractFactory("Proxy");
    // const proxy = await Proxy.deploy(v1.address);
    //
    // const proxiedV1 = await V1.attach(proxy.address);
    //
    // await proxiedV1.initialize();
    // await proxiedV1.transfer(addr1, value1);
    // console.log(await proxiedV1.balanceOf(addr1));

    // // execute referral process
    // await deployedUpgradableReferralContract
    //   .connect(referee)
    //   .forwardReferralPayment(referrer.address, {
    //     value: ethConverter(PAYMENT_AMOUNT),
    //   });
    //
    // // results
    // const afterReceiverBalance = await receiver.getBalance();
    // const receiverResult =
    //   initialReceiverBalance.toBigInt() + ethConverter(PRICE).toBigInt();

    // assertions
    // expect(afterReceiverBalance.toBigInt()).to.equal(receiverResult);
  });
});
