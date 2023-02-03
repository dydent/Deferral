// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { writeLogFile } from "../helpers/write-files";
import { getNetworkInfo } from "../helpers/get-network-info";

// list of all UZH token contracts --> contracts/UZHETHTokens.sol
const TOKENS: string[] = ["DeferralToken"];
export const AMOUNT_TO_CLAIM: number = 10000000000000;

async function main() {
  // collect deployed token addresses
  const addresses: any = {};

  // create transaction signer
  const deployers = await ethers.getSigners();
  const deployer = deployers[0];
  // const contractOwner = deployer.address;
  // get current network
  const networkID = await getNetworkInfo(deployer);

  // /*         deploy token contracts         */
  const deployTokens = async () => {
    for (const t of TOKENS) {
      // deploy token contract
      const Token = await ethers.getContractFactory(t);
      const token = await Token.deploy();
      await token.deployed();
      // save token address
      addresses[t] = { address: token.address };
      console.log(`Deployed ${t} to: ${token.address}`);
    }
  };
  await deployTokens();
  console.log(`Deployed ${TOKENS.length} tokens to the ${networkID} network!`);

  // write file to json
  const tokenInput = { date: new Date(), tokens: addresses };
  const tokenFile: string = "tokenAddresses.json";
  writeLogFile(tokenFile, tokenInput, networkID);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
