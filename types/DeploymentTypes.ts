export type DeploymentLogJsonInputType = {
  date: Date;
  contract: string;
  contractAddress: string;
  signer: string;
  gasUsed: string;
  effectiveGasPrice: string;
  cost: string;
  durationInMs: number;
};
