
# Deferral - High-Volume Decentralized Blockchain-Based Referral Systems

This GitHub repository entails the source code and files developed as part of the Master's Thesis of Tobias Boner at the
University of Zurich in 2022/2023.

The developed Deferral solution represents a set of tested and documented Solidity smart contracts that aim to investigate and evaluate the feasibility of a high-volume decentralized referral system.

Moreover, the [Deferral Visualizations](https://github.com/dydent/visualizations-deferral) GitHub repository is also part of the solution for the thesis and includes the source code and files needed for the evaluation of the results.

In the following, the technologies used, the repository structure, the installation guidelines, and other details about this project are outlined.

## Technologies Used

Amon others, the following technologies have been used for the implementation and development of the Deferral solution:


### Development Environment and Tools

- [**Hardhat**](https://hardhat.org/): A development environment that facilitates building, testing, and deploying smart
  contracts on to different networks.
- [**Hardhat Gas Reporter**](https://github.com/cgewecke/hardhat-gas-reporter): A Hardhat plugin that generates gas
  usage reports for smart contract function and deployment calls.
- [**TypeScript**](https://www.typescriptlang.org/): A strongly-typed superset of JavaScript that adds static types,
  enabling better development experience, improved maintainability, and better code quality.
- [**Yarn**](https://yarnpkg.com/): Package Manager.

### Smart Contracts

- [**Solidity**](https://soliditylang.org/): A statically-typed, high-level programming language for implementing EVM
  compatible smart contracts.
- [**TypeChain**](https://github.com/ethereum-ts/TypeChain): A code generation tool that creates TypeScript bindings for
  Ethereum smart contracts providing type-safe interactions and reducing the risk of errors.
- [**sol2uml**](https://github.com/naddison36/sol2uml): A tool for generating UML diagrams from Solidity source code,
  providing visual representations of the contract structure and relationships.

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

A CI workflow is set up using GitHub Actions to run various checks and tests on the codebase automatically. The workflow
is triggered on workflow dispatch, pull requests, and pushes to the main branch. The CI job includes the following
steps:

- Checkout the repository - Install Node.js
- Install dependencies
- Lint the code - Compile the contracts and generate TypeChain bindings
- Test the contracts and generate the coverage report Environment variables required by the workflow are set using
  GitHub secrets.

The required GitHub secrets should be defined in the repository's settings for the workflow to run correctly.

## Project Structure

- **contracts**/ *contains all the Solidity contracts*
  - referral-evaluators/ *referral evaluator contracts*
    - referral-multilevel-token-rewards/
    - referral-payment-multilevel-rewards/
    - referral-payment-quantity/
    - referral-payment-transmitter/
    - referral-payment-value/
  - tokens/ *token contracts*
- **helpers**/ *helper functions*
  - constants/
  - deployer-functions/
  - evaluation-helpers/
  - test-helpers/
- **logs**/ *directory where the generated deployment and evaluation data will be stored*
- **results**/
	- result-data/
	- result-visualizations/
- **scripts**/ *deployment and evaluation scripts*
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
- **test**/ *test files for all the contracts*
  - referral-multilevel-token-rewards/
  - referral-payment-multilevel-rewards/
  - referral-payment-quantity/
  - referral-payment-transmitter/
  - referral-payment-value/
- **types**/
  - contract-parameter-types/
  - fixture-types/

# Installation Guidelines and Setup

To set up and run the code locally, follow these steps:

## Prerequisites
 Before you begin, ensure you have met the following requirements: 
 * You have installed the latest version of [Node.js](https://nodejs.org/) and [yarn](https://yarnpkg.com/). 

Be aware that storing files programmatically, done for the log file creation in the Deferral code, differs between Windows and Mac & Linux due to the differing syntax used for file paths.
Hence, this can lead to errors when using Windows.
Therefore it is recommended to use Mac or Linux.

## Installing Deferral

To install the Deferral repository, follow these steps: 
1. Clone the repository: 
	- ``` git clone https://github.com/dydent/Deferral.git ``` 
2. Navigate into the project directory: 
	- ``` cd Deferral ``` 
3. Install the dependencies: 
	- ``` yarn install ```

### Env Variables
It is necessary to create a local `.env` file containing key-value pairs of environment variables the project requires.

The `.env.example` file shows examples of all the values that must be set up and includes explanations for the different values.


### Hardhat Setup and Configuration
The Hardhat project can be configured and adapted in the `hardhat.config.ts` file.
Hardhat can be used to execute the [tests](https://hardhat.org/tutorial/testing-contracts) and the [scripts](https://hardhat.org/hardhat-runner/docs/advanced/scripts).
More details on this can be found in the linked Hardhat documentation.

### Tests
The developed tests can be executed by running the `npx hardhat test` command in the console or by executing the test scripts found in the `package.json` file.

### Deployment Scripts
You can run the deployment scripts using the Hardhat CLI commands or the deployment scripts configured in the `package.json` file.
Additionally, to execute all the deployment scripts at once, the `deploy.sh` script can be executed by running `.\deploy.sh` in the terminal.


### Evaluation Scripts
To generate the result data and run the evaluation scripts, you can use the Hardhat CLI commands or the evaluation scripts configured in the `package.json` file.
Additionally, to execute all the evaluation scripts at once the `evaluate.sh` script can be executed by running `.\evaluate.sh` in the terminal.
To adapt several parameters of the evaluation execution the values in the `evaluate.sh` script can be adjusted.

### UML Class Diagrams
To generate UML class diagrams of all the Solidity contracts, the `generate_contract_diagrams.sh` script can be run.


## Logging and Result Data

The deployment and evaluation scripts record several measures and metrics during their execution and store the collected data as `.json` files locally inside the `./logs` directory.
Thereby the different log files are further grouped by the folders of the solution contracts and the network the evaluation or deployment was executed on.

The log data that was used for the evaluation in the thesis was extracted and additionally saved in the `results/` directory of this repository.



# Evaluation and Analysis
The result data is evaluated and analyzed by scripts collected in a separate [Deferral Visualizations](https://github.com/dydent/visualizations-deferral) submodule repository.

Eventually, for the proper setup of this repository, the visualization submodule repository should be installed as a subfolder or subproject in the root folder of this repository.
More Instructions on this can be found in the corresponding [README](https://github.com/dydent/visualizations-deferral/blob/main/README.md) file of the visualization repository.

