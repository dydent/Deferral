import {JsonRpcSigner} from "@ethersproject/providers";

// proxy resolver functions to be used in gasReporter in hardhat.config.ts
export const proxyResolver = (provider: JsonRpcSigner) => {
  return {
    eth_sendTransaction: async (payload: any, next: any) => {
      console.log("payload transaction", payload, "");
      payload.params[0].gasLimit = await provider.provider.estimateGas(
        payload.params[0]
      );
      return next();
    },
    eth_call: async (payload: any, next: any) => {
      console.log("payload call", payload, "");
      payload.params[0].gas = await provider.provider.estimateGas(
        payload.params[0]
      );
      return next();
    },
  };
};
