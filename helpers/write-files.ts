import fs from "fs";
import path from "path";

// -----------------------------------------------------------------------------------------------
// helper function for writing logs of the contract deployment scripts
// -----------------------------------------------------------------------------------------------

type InputIDType = {
  id?: number;
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
export const writeLogFile = <InputType>({
  directory,
  filePath,
  jsonInput,
  chainID,
  chainName,
  fileTypeExtension = "json",
}: {
  directory: string;
  filePath: string;
  jsonInput: InputType;
  chainID: number | undefined;
  chainName: string | undefined;
  fileTypeExtension?: "json" | "csv" | "txt";
}): void => {
  const stringChainID = chainID ? chainID.toString() : "___";
  const fullPath =
    "./logs/" +
    directory +
    chainName +
    "_" +
    stringChainID.toString() +
    "/" +
    filePath +
    "." +
    fileTypeExtension;

  console.log("writing log file...");
  ensureDirectoryExistence(fullPath);

  let data: Array<InputType & InputIDType> = [];

  let action: "created" | "updated" = "created";

  // If the file exists, read the contents and parse them
  if (fs.existsSync(fullPath)) {
    try {
      const fileContents = fs.readFileSync(fullPath, "utf8");
      data = JSON.parse(fileContents);
      action = "updated";
    } catch (err) {
      console.error(err);
    }
  }

  // Assign a unique ID based on the length of the existing data array

  const inputWithId: InputType & InputIDType = {
    id: data.length,
    ...jsonInput,
  };
  // jsonInput.id = data.length + 1;

  // Append the new data
  data.push(inputWithId);

  // Write the updated data to the file
  try {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 4));
    console.log(`${action} log file - successfully written in ${fullPath}!`);
  } catch (err) {
    console.error(err);
  }
};
