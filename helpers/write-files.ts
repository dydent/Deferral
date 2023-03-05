import fs from "fs";
import path from "path";

export type LogJsonInputType = {
  date: Date;
  contract: string;
  contractAddress: string;
  signer: string;
  durationInMs: number;
};

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// write values to json file logs
export const writeLogFile = ({
  filePath,
  jsonInput,
  chainID,
  chainName,
}: {
  filePath: string;
  jsonInput: LogJsonInputType;
  chainID: number | undefined;
  chainName: string | undefined;
}): void => {
  const stringChainID = chainID ? chainID.toString() : "___";
  const fullPath =
    "./logs/" + chainName + "_" + stringChainID.toString() + "_" + filePath;

  console.log("writing log file...");
  if (fs.existsSync(fullPath)) {
    try {
      ensureDirectoryExistence(fullPath);
      fs.appendFileSync(fullPath, JSON.stringify(jsonInput));
      console.log(`log file appended - successfully appended in ${fullPath}!`);
    } catch (err) {
      console.error(err);
    }
  } else {
    try {
      ensureDirectoryExistence(fullPath);
      fs.writeFileSync(fullPath, JSON.stringify(jsonInput));
      console.log(`log file created - successfully written in ${fullPath}!`);
    } catch (err) {
      console.error(err);
    }
  }
};
