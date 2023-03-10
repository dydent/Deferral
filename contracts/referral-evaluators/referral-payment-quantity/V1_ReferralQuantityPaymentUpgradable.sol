// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V1ReferralQuantityPaymentUpgradable is
    Initializable,
    OwnableUpgradeable
{
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // address of the receiver wallet
    address payable public receiverAddress;
    // percentage of the paid amount that is distributed as referral reward upon completion
    uint256 public rewardPercentage;
    // required amount of payments in order to successfully complete referral process
    uint256 public requiredAmountOfPayments;

    //   referral conditions required for evaluating the referral process
    struct ReferralConditions {
        // set true if the referral has been successful & rewards have been paid out
        bool referralProcessCompleted;
        // set true if the referrer address has been set
        bool referrerAddressHasBeenSet;
        address payable referrerAddress;
        uint paidValue;
        uint paymentQuantity;
    }

    // mapping for referees including their data for referral conditions
    mapping(address => ReferralConditions)
        public refereeReferralConditionsMapping;

    // -----------------------------------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------
    function setReferrerAddress(
        address _refereeAddress,
        address payable _referrerAddress
    ) internal {
        ReferralConditions
            storage recordedConditions = refereeReferralConditionsMapping[
                _refereeAddress
            ];
        require(
            !recordedConditions.referrerAddressHasBeenSet,
            "Referrer Address has been set"
        );
        //      update values
        recordedConditions.referrerAddress = _referrerAddress;
        recordedConditions.referrerAddressHasBeenSet = true;
    }

    function evaluateReferralConditions(address _referee) internal {
        ReferralConditions
            storage conditionsToEvaluate = refereeReferralConditionsMapping[
                _referee
            ];
        if (conditionsToEvaluate.paymentQuantity > requiredAmountOfPayments) {
            uint256 calculatedReward = (conditionsToEvaluate.paidValue / 100) *
                rewardPercentage;
            if (conditionsToEvaluate.referrerAddressHasBeenSet) {
                require(
                    address(this).balance >= calculatedReward,
                    "Contract has not enough funds to pay rewards"
                );
                conditionsToEvaluate.referrerAddress.transfer(calculatedReward);
                conditionsToEvaluate.referralProcessCompleted = true;
            }
        }
    }

    function updateConditions(
        address _referee,
        address payable _referrer,
        uint _amount
    ) internal {
        ReferralConditions
            storage updatedConditions = refereeReferralConditionsMapping[
                _referee
            ];
        require(
            !updatedConditions.referralProcessCompleted,
            "This referral process has been completed"
        );
        // initially set the referrer address
        if (!updatedConditions.referrerAddressHasBeenSet) {
            updatedConditions.referrerAddress = _referrer;
            updatedConditions.referrerAddressHasBeenSet = true;
        }
        // update referral conditions values
        updatedConditions.paidValue += _amount;
        updatedConditions.paymentQuantity += 1;

        // check if referral conditions are met
        evaluateReferralConditions(_referee);
    }

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // forward paymentAmount to the receiver and send referralReward to the referrerAddress
    function forwardReferralPayment(
        address payable _referrerAddress
    ) external payable {
        require(
            (msg.value / 100) * rewardPercentage < msg.value,
            "reward must be portion of paymentAmount"
        );
        updateConditions(msg.sender, _referrerAddress, msg.value);
        // calculate reward and payment prices & forward payment
        uint256 reward = (msg.value / 100) * rewardPercentage;
        uint256 receiverAmount = msg.value - reward;
        receiverAddress.transfer(receiverAmount);
    }

    function initialize(
        address payable _receiver,
        uint256 _rewardPercentage,
        uint256 _requiredAmountOfPayments
    ) public initializer {
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "reward percentage must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiver;
        rewardPercentage = _rewardPercentage;
        requiredAmountOfPayments = _requiredAmountOfPayments;
    }

    // function to update the receiver address
    function updateReceiverAddress(
        address payable updatedReceiverAddress
    ) public onlyOwner {
        receiverAddress = updatedReceiverAddress;
    }

    // function to update the referral reward
    function updateReferralReward(uint256 _newReferralReward) public onlyOwner {
        require(
            _newReferralReward >= 0 && _newReferralReward <= 100,
            "reward percentage must be between 0 and 100"
        );

        rewardPercentage = _newReferralReward;
    }

    // function to update the referral reward
    function updateRequiredAmountOfPayments(
        uint256 _newAmountOfPayments
    ) public onlyOwner {
        requiredAmountOfPayments = _newAmountOfPayments;
    }

    // view functions do only read and not update any data of a contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
