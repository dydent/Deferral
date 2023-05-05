#!/bin/bash


# to execute this script run in the console:
# chmod +x generate_contract_diagrams.sh
#./generate_contract_diagrams.sh
# NOTE: inkscape has to be installed for generating the pdfs


# Check if the solidity-contract-diagrams folder exists, create it if it doesn't
if [ ! -d "solidity-contract-diagrams" ]; then
  mkdir "solidity-contract-diagrams"
fi

# Find all Solidity files in the contracts folder and its subfolders
find contracts -type f -name "*.sol" | while read -r file; do
  # Remove the 'contracts' prefix to get the relative path
  relative_path=$(echo "$file" | sed -e 's/^contracts//')

  # Create the corresponding output subdirectory if it doesn't exist
  mkdir -p "solidity-contract-diagrams/$(dirname "$relative_path")"

  # Generate the UML diagram and save it in the corresponding output subdirectory
  sol2uml "$file" -o "solidity-contract-diagrams/${relative_path%.sol}.svg"

  # Convert the SVG to PDF using Inkscape
  inkscape "solidity-contract-diagrams/${relative_path%.sol}.svg" --export-type=pdf --export-filename="solidity-contract-diagrams/${relative_path%.sol}.pdf"
done

# generate combined svg diagram fo all contracts
sol2uml class ./contracts --outputFileName solidity-contract-diagrams/all-contracts.svg

# Convert the combined SVG to PDF
inkscape "solidity-contract-diagrams/all-contracts.svg" --export-type=pdf --export-filename="solidity-contract-diagrams/all-solidity-contracts"
