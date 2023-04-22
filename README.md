# Deferral - Decentralized Referral Systems

This repository entails the source code and files developed as part of the Master's Thesis of Tobias Boner at the
University of Zurich in 2022/2023.

The Deferral solution represents mulitple smart contracts that can be used to implement and operate a decentralized
referral system on the blockchain.

## Technologies Used

Amon others the following technologies have been used:

### Smart Contracts

- [**Solidity**](https://soliditylang.org/): A statically-typed, high-level programming language for implementing EVM
  compatible smart contracts.
- [**TypeChain**](https://github.com/ethereum-ts/TypeChain): A code generation tool that creates TypeScript bindings for
  Ethereum smart contracts, providing type-safe interactions and reducing the risk of errors.
- [**sol2uml**](https://github.com/naddison36/sol2uml): A tool for generating UML diagrams from Solidity source code,
  providing visual representations of the contract structure and relationships.

### Development Environment and Tools

- [**Hardhat**](https://hardhat.org/): A development environment that facilitates building, testing, and deploying smart
  contracts on to different networks.
- [**Hardhat Gas Reporter**](https://github.com/cgewecke/hardhat-gas-reporter): A Hardhat plugin that generates gas
  usage reports for smart contract function and deployment calls.
- [**TypeScript**](https://www.typescriptlang.org/): A strongly-typed superset of JavaScript that adds static types,
  enabling better development experience, improved maintainability, and better code quality.
- [**Yarn**](https://yarnpkg.com/): Package Manager.

### Code Quality and Linters

- [**ESLint**](https://eslint.org/): Linting utility that helps maintain code quality and enforce coding standards.
- [**Solhint**](https://github.com/protofire/solhint): Linter and style checker for Solidity code, ensuring code quality
  and adherence to best practices.
- [**Solcover**](https://github.com/sc-forks/solidity-coverage): Code coverage tool for Solidity contracts, enabling
  developers to measure and improve testing coverage for their smart contracts.
- [**Prettier**](https://prettier.io/): Code formatter that enforces consistent style across the codebase, improving
  readability and maintainability.

### Data Analysis and Visualization

- [**Python**](https://www.python.org/): Used in
  the [visualiations-deferral](https://github.com/dydent/visualizations-deferral) submodule repository for the data
  analysis and viusalizations.
- [**Plotly**](https://plotly.com/python/): Graphing library for Python, providing interactive, web-based data
  visualizations.

## Continuous Integration (CI)

A CI workflow is set up using GitHub Actions to automatically run various checks and tests on the codebase. The workflow
is triggered on workflow dispatch, pull requests, and pushes to the main branch. The CI job includes the following
steps:

- Checkout the repository - Install Node.js
- Install dependencies -
- Lint the code - Compile the contracts and generate TypeChain bindings
- Test the contracts and generate the coverage report Environment variables required by the workflow are set using
  GitHub secrets.

The GitHub secrets should be defined in the repository's settings.

## Project Structure

- contracts/
  - referral-evaluators/
    - referral-multilevel-token-rewards/
    - referral-payment-multilevel-rewards/
    - referral-payment-quantity/
    - referral-payment-transmitter/
    - referral-payment-value/
  - tokens/
- gas-reporter-logs/
- helpers/
  - constants/
  - deployer-functions/
  - evaluation-helpers/
  - test-helpers/
- logs/
  - evaluations/
    - referral-multilevel-token-rewards/
      - Hardhat-Local_31337/
    - referral-payment-multilevel-rewards/
      - Hardhat-Local_31337/
    - referral-payment-quantity/
      - Hardhat-Local_31337/
    - referral-payment-transmitter/
      - Hardhat-Local_31337/
    - referral-payment-value/
      - Hardhat-Local_31337/
        - evaluations/
          - referral-payment-value/
- scripts/
  - deployment/
    - referral-multilevel-token-rewards/
    - referral-payment-multilevel-rewards/
    - referral-payment-quantity/
    - referral-payment-transmitter/
    - referral-payment-value/
  - evaluation/
    - referral-multilevel-token-rewards/
    - referral-payment-multilevel-rewards/
    - referral-payment-quantity/
    - referral-payment-transmitter/
    - referral-payment-value/
- solidity-contract-diagrams/
  - referral-evaluators/
    - referral-multilevel-token-rewards/
    - referral-payment-multilevel-rewards/
    - referral-payment-quantity/
    - referral-payment-transmitter/
    - referral-payment-value/
  - tokens/
- test/
  - referral-multilevel-token-rewards/
  - referral-payment-multilevel-rewards/
  - referral-payment-quantity/
  - referral-payment-transmitter/
  - referral-payment-value/
- types/
  - contract-parameter-types/
  - fixture-types/

This repository contains a collection of Solidity smart contracts developed using Hardhat, TypeScript, and TypeChain.
The contracts are stored in the `contracts` folder. Tests for all contracts are provided in the `test` folder, and
deployment and evaluation scripts are located in the `scripts` folder. Yarn is used as the package manager, with scripts
defined in the `package.json` file for each contract's deployment and evaluation.

## Setup and Installation

To set up and run the code locally, follow these steps:

1. Install Node.js: Ensure that you have [Node.js](https://nodejs.org/) installed on your local machine.
2. Clone the repository: Clone this repository to your local machine by running the following command:
3. Install the dependencies:

- Using Yarn: `yarn install`
- Using NPM: `npm install`

4. Use yarn or hardhat to run the developed scripts to deploy and evaluate the contracts

## Running Deployment Scripts

This project includes deployment scripts for deploying the contracts to a local network or a testnet.

### Local Network

To deploy the contracts to a local Hardhat network, run the following command:

bashCopy code

`npx hardhat run scripts/deploy-local.ts`

### Testnet

To deploy the contracts to a testnet, such as Rinkeby, first set up your network in `hardhat.config.ts`:

> Written with [StackEdit](https://stackedit.io/).# Deferral - Decentralized Referral Systems

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

## Deployment - Referral Contracts

To deploy all smart contracts related to Uniswap functionalities, you can run the following command:

```
hardhat run scripts/deploy-contracts.ts --network ...
```

## Logging

The addresses of the various deployed contracts will be locally logged and saved into `.json` files inside
the `./logs`  
directory on your machine in case you want to reinspect some details of your deployments later.

To differentiate which network the contracts were deployed to, the file names are prefixed with the network name and  
chain ID.  
For instance, addresses for the Goerli Testnet network (chainID = 5) can be found locally after script execution  
in `./logs/goerli_5_.....json`.
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
