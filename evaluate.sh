#!/bin/bash

# to execute this script run in the console:
# chmod +x evaluate.sh
# ./evaluate.sh

# define the different number of accounts the evaluation scripts should be run with
evaluation_accounts_values=(10 100 500)
use_evaluation_accounts="${1:-true}"




# Store evaluation run values in a string for better readability
evaluation_accounts_values_string=""
for value in "${evaluation_accounts_values[@]}"; do
  evaluation_accounts_values_string+=$(printf "%s, " "$value")
done

echo ""
echo ""
echo ""
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo " Running all evaluation scripts with $evaluation_accounts_values_string accounts"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo "******************************************************************************************************************"
echo ""
echo ""
echo ""



for accounts in "${evaluation_accounts_values[@]}"; do

  echo "******************************************************************************************************************"
  echo "******************************************************************************************************************"
  echo "******************************************************************************************************************"
  echo " Running all evaluation scripts with: $accounts accounts"
  echo " NUMBER_OF_EVALUATION_ACCOUNTS = $accounts"
  echo "******************************************************************************************************************"
  echo "******************************************************************************************************************"
  echo "******************************************************************************************************************"

  export NUMBER_OF_EVALUATION_ACCOUNTS=$accounts
  export USE_EVALUATION_ACCOUNTS=$use_evaluation_accounts

  # evaluate all transmitter contracts
  yarn evaluate-transmitter-v1
  yarn evaluate-transmitter-v3
  # evaluate quantity contracts
  yarn evaluate-quantity-v1
  yarn evaluate-quantity-v2
  # evaluate value contracts
  yarn evaluate-value-v1
  yarn evaluate-value-v2
  yarn evaluate-value-v3
  # evaluate multilevel contracts
  yarn evaluate-multilevel-v1
  yarn evaluate-multilevel-v2
  # evaluate token contracts
  yarn evaluate-token-multilevel-v1
done

unset NUMBER_OF_EVALUATION_ACCOUNTS
unset USE_EVALUATION_ACCOUNTS
