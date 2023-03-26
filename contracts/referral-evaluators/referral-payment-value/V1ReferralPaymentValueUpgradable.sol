// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// Uses no internal functions to split up code --> observe & analyze effect on gas costs
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V1ReferralPaymentValueUpgradable is Initializable, OwnableUpgradeable {
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // address of the receiver/company wallet
    address payable public receiverAddress;
    // percentage of the total paid amount that will be distributed as reward
    uint256 public rewardPercentage;
    // threshold value for evaluating referral process
    uint256 public paymentsValueThreshold;

    struct ReferralProcess {
        // set true if the referral has been successful & rewards have been paid out
        bool referralProcessCompleted;
        // set true if the referrer address has been set
        bool referrerAddressHasBeenSet;
        address payable referrerAddress;
        uint256 paymentsValue;
        uint256 paymentsQuantity;
    }

    // mapping for referees including their data for referral conditions progress
    mapping(address => ReferralProcess) public refereeProcessMapping;

    // -----------------------------------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------------------------------

    event ReferralCompleted(address indexed referee, address indexed referrer);
    event ReferralConditionsUpdated(address indexed referee);
    event ReceiverUpdated(address indexed newReceiver);
    event RewardUpdated(uint256 newReward);
    event ValueThresholdUpdated(uint256 newValueThreshold);

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // register and forward referral payment tx
    function registerReferralPayment(
        address payable _referrerAddress
    ) external payable {
        require(msg.sender != _referrerAddress, "Sender cannot be referrer");
        // get current referee process data
        ReferralProcess storage currentProcess = refereeProcessMapping[
            msg.sender
        ];
        // referral process must not be completed
        require(
            !currentProcess.referralProcessCompleted,
            "Referral process has been completed for this address"
        );
        //  set referrer address first time
        if (!currentProcess.referrerAddressHasBeenSet) {
            // update values
            currentProcess.referrerAddress = _referrerAddress;
            currentProcess.referrerAddressHasBeenSet = true;
        }
        // set and update values
        currentProcess.paymentsValue += msg.value;
        currentProcess.paymentsQuantity += 1;
        emit ReferralConditionsUpdated(msg.sender);
        // evaluate referral process and progress
        if (currentProcess.paymentsValue > paymentsValueThreshold) {
            uint256 calculatedReward = (currentProcess.paymentsValue / 100) *
                rewardPercentage;
            if (currentProcess.referrerAddressHasBeenSet) {
                require(
                    address(this).balance >= calculatedReward,
                    "Contract has not enough funds to pay rewards"
                );
                currentProcess.referrerAddress.transfer(calculatedReward);
                currentProcess.referralProcessCompleted = true;
                emit ReferralCompleted(msg.sender, _referrerAddress);
            }
        }
        // calculate reward and payment prices
        uint256 reward = (msg.value / 100) * rewardPercentage;
        uint256 receiverAmount = msg.value - reward;
        // forward payment to receiver
        receiverAddress.transfer(receiverAmount);
    }

    function initialize(
        address payable _receiver,
        uint256 _rewardPercentage,
        uint256 _paymentsValueThreshold
    ) public initializer {
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiver;
        rewardPercentage = _rewardPercentage;
        paymentsValueThreshold = _paymentsValueThreshold;
    }

    function updateReceiverAddress(
        address payable _updatedReceiverAddress
    ) public onlyOwner {
        receiverAddress = _updatedReceiverAddress;
        emit ReceiverUpdated(_updatedReceiverAddress);
    }

    function updateReferralReward(uint256 _newReferralReward) public onlyOwner {
        require(
            _newReferralReward >= 0 && _newReferralReward <= 100,
            "percentage value must be between 0 and 100"
        );
        rewardPercentage = _newReferralReward;
        emit RewardUpdated(_newReferralReward);
    }

    function updateValueThreshold(
        uint256 _newPaymentsValueThreshold
    ) public onlyOwner {
        paymentsValueThreshold = _newPaymentsValueThreshold;
        emit ValueThresholdUpdated(_newPaymentsValueThreshold);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
