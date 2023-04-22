// -----------------------------------------------------------------------------------------------
// helper function to get the key of an enum by its value
// -----------------------------------------------------------------------------------------------

// returns the key corresponding to the given value in the provided enum object.
export function getKeyByValue(
  enumObj: Record<string, string>,
  value: string
): string | undefined {
  // iterate over enum keys, find and return the key with the matching value
  return Object.keys(enumObj).find((key) => enumObj[key] === value);
}
