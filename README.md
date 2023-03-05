# Deferral - Decentralized Referral Systems

| Statements                  | Branches                | Functions                 | Lines             |
| --------------------------- | ----------------------- | ------------------------- | ----------------- |
| ![Statements](#statements#) | ![Branches](#branches#) | ![Functions](#functions#) | ![Lines](#lines#) |

This repository entails the source code for the Master's Thesis of Tobias Boner at the University of Zurich.

The Deferral Repository includes solutions for decentralized referral systems.
In particular in includes the smart contracts, scripts & tests.

By using the [Hardhat](https://hardhat.org/) project setup, all necessary contracts can be deployed and tested.
Hardhat is currently configured for deployment on three chains,
either the local Harhdat, your local [Ganache](https://trufflesuite.com/ganache/) or the Goerli Testnet are configured.

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
hardhat run scripts/deploy-V1ReferralPaymentProxy.ts --network ...
```

## Logging

The addresses of the various deployed contracts will be locally logged and saved into `.json` files inside the `./logs`
directory on your machine in case you want to reinspect some details of your deployments later.

To differentiate which network the contracts were deployed to, the file names are prefixed with the network name and
chain ID.
For instance, addresses for the Goerli Testnet network (chainID = 5) can be found locally after script execution
in `./logs/goerli_5_.....json`.
