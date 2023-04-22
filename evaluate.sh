#!/bin/bash

# to execute this script run in the console:
# chmod +x evaluate.sh
#./evaluate.sh

# define the different number of accounts the evaluation scripts should be run with
evaluation_accounts_values=(10 20 100)
use_evaluation_accounts="${1:-true}"

for accounts in "${evaluation_accounts_values[@]}"; do
  echo "Running scripts with NUMBER_OF_EVALUATION_ACCOUNTS=$accounts and USE_EVALUATION_ACCOUNTS=$use_evaluation_accounts"
  export NUMBER_OF_EVALUATION_ACCOUNTS=$accounts
  export USE_EVALUATION_ACCOUNTS=$use_evaluation_accounts

  yarn evaluate-transmitter-v1
  yarn evaluate-transmitter-v3
  yarn evaluate-quantity-v1
  yarn evaluate-quantity-v2
  yarn evaluate-value-v1
  yarn evaluate-value-v2
  yarn evaluate-value-v3
  yarn evaluate-multilevel-v1
  yarn evaluate-multilevel-v2
  yarn evaluate-token-multilevel-v1
done

unset NUMBER_OF_EVALUATION_ACCOUNTS
unset USE_EVALUATION_ACCOUNTS
