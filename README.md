# Deferral - Decentralized Referral Systems

This repository entails the source code for the Master's Thesis of Tobias Boner at the University of Zurich.

The Deferral Repository includes solutions for decentralized referral systems.
In particular in includes the smart contracts, scripts & tests.

By using the [Hardhat](https://hardhat.org/) project setup, all necessary contracts can be deployed and tested.
Hardhat is currently configured for deployment on three chains,
either the local Harhdat, your local [Ganache](https://trufflesuite.com/ganache/) or the Goerli Testnet are configured.

## Getting Started

1. Clone this repository.
2. Install dependencies:
   - Using Yarn: `yarn install`
   - Using NPM: `npm install`
3. Compile contracts: `npx hardhat compile`
4. Run tests: `npx hardhat test`

## Running Deployment Scripts

This project includes deployment scripts for deploying the contracts to a local network or a testnet.

### Local Network

To deploy the contracts to a local Hardhat network, run the following command:

bashCopy code

`npx hardhat run scripts/deploy-local.ts`

### Testnet

To deploy the contracts to a testnet, such as Rinkeby, first set up your network in `hardhat.config.ts`:

typescriptCopy code

``import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
// ...
networks: {
rinkeby: {
url: "https://rinkeby.infura.io/v3/your-infura-api-key",
accounts: [`0x${process.env.RINKEBY_PRIVATE_KEY}`],
},
// ...
},
};``

Then run the deployment script for the desired network, passing in any necessary arguments:

bashCopy code

`npx hardhat run scripts/deploy-testnet.ts --network rinkeby`

## Project Structure

- `contracts/`: Solidity smart contracts.
- `scripts/`: Deployment scripts for deploying contracts.
- `test/`: Mocha tests for the contracts.
- `types/`: TypeScript type definitions for the contracts and Hardhat.
- `hardhat.config.ts`: Hardhat configuration file.
- `tsconfig.json`: TypeScript configuration file.
- `README.md`: This file.

## Setup

In the root folder, create a `.env` file with at least the following values:

```
DEPLOYER_OWNER_PK="<private key of a compatible account>"
RECEIVER_COMPANY_PK ="<different private key of a compatible account>"
REFERRER_PK ="<different private key of a compatible account>"
REFEREE_PK ="<different private key of a compatible account>"
...
```

```
GANACHE_PRIVATE_KEY="<private key of a valid GANACHE account to deploy contracts>"
GANACHE_SECOND_PRIVATE_KEY=7f1aeea2c20558a1a993cbc171b917954c3575af64e0c98afb7fbd5289516325="<second and different private key of another valid GANACHE account to deploy contracts>"
```

The PKs are sensible data but needed to deploy the smart contracts on the different chains.
After a successful setup, you start deploying the contracts yourself.

## Quickstart

- Install dependencies: `yarn.`
- Deploy all contracts and example tokens: `npm run deploy:[uzh|ganache]`
- ***

## Deployment - Referral Contracts

To deploy all smart contracts related to Uniswap functionalities, you can run the following command:

```
hardhat run scripts/deploy-contracts.ts --network ...
```

## Logging

The addresses of the various deployed contracts will be locally logged and saved into `.json` files inside the `./logs`
directory on your machine in case you want to reinspect some details of your deployments later.

To differentiate which network the contracts were deployed to, the file names are prefixed with the network name and
chain ID.
For instance, addresses for the Goerli Testnet network (chainID = 5) can be found locally after script execution
in `./logs/goerli_5_.....json`.
