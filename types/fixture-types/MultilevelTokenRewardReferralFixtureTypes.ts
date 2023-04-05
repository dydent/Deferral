import { BaseContract, BigNumber } from "ethers";
import { ERC20 } from "../../typechain-types";
import {
  MultilevelRewardReferralFixtureInputType,
  MultilevelRewardReferralFixtureReturnType,
  V2MultilevelRewardReferralFixtureInputType,
} from "./MultilevelRewardReferralFixtureTypes";

export type MultilevelTokenRewardReferralFixtureReturnType<
  T extends BaseContract,
  TokenType extends BaseContract & ERC20
> = MultilevelRewardReferralFixtureReturnType<T> & {
  token: TokenType;
};

export type MultilevelTokenRewardReferralFixtureInputType =
  MultilevelRewardReferralFixtureInputType &
    V2MultilevelRewardReferralFixtureInputType & {
      tokenName: string;
      initialTokenSupply: BigNumber;
      tokenSupplyPerAccount: BigNumber;
    };
