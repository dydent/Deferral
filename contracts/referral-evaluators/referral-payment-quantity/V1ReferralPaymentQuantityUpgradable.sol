// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// Uses internal functions to split up code to make it more readable --> observe & analyze effect on gas costs
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V1ReferralPaymentQuantityUpgradable is
    Initializable,
    OwnableUpgradeable
{
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // address of the receiver/company wallet
    address payable public receiverAddress;
    // percentage of the total paid amount that will be distributed as reward
    uint256 public rewardPercentage;
    // threshold value for evaluating referral process
    uint256 public paymentsQuantityThreshold;

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

    // Referral Event to be emitted once a referral process has been completed
    event ReferralCompleted(address indexed referee, address indexed referrer);
    event ReferralConditionsUpdated(address indexed referee);
    event ReceiverUpdated(address indexed newReceiver);
    event RewardUpdated(uint256 newReward);
    event QuantityThresholdUpdated(uint256 newQuantityThreshold);

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // register & forward payment and update referral process data
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
        // update progress
        update(msg.sender, _referrerAddress, msg.value);
        // calculate reward and payment prices
        uint256 reward = (msg.value / 100) * rewardPercentage;
        uint256 receiverAmount = msg.value - reward;
        // evaluate referral progress and if complete payout rewards
        evaluateProcess(msg.sender);
        // forward payment to receiver
        receiverAddress.transfer(receiverAmount);
    }

    function initialize(
        address payable _receiver,
        uint256 _rewardPercentage,
        uint256 _paymentsQuantityThreshold
    ) public initializer {
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiver;
        rewardPercentage = _rewardPercentage;
        paymentsQuantityThreshold = _paymentsQuantityThreshold;
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

    function updateQuantityThreshold(
        uint256 _newPaymentsQuantityThreshold
    ) public onlyOwner {
        paymentsQuantityThreshold = _newPaymentsQuantityThreshold;
        emit QuantityThresholdUpdated(_newPaymentsQuantityThreshold);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // -----------------------------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    function setReferrerAddress(
        address _refereeAddress,
        address payable _referrerAddress
    ) internal {
        ReferralProcess storage process = refereeProcessMapping[
            _refereeAddress
        ];
        if (!process.referrerAddressHasBeenSet) {
            // update values
            process.referrerAddress = _referrerAddress;
            process.referrerAddressHasBeenSet = true;
        }
    }

    function evaluateProcess(address _referee) internal {
        ReferralProcess storage currentProcess = refereeProcessMapping[
            _referee
        ];
        // require referrer address has been set
        require(
            currentProcess.referrerAddressHasBeenSet,
            "Referrer Address has not been set for this referee"
        );

        if (currentProcess.paymentsQuantity > paymentsQuantityThreshold) {
            uint256 calculatedReward = (currentProcess.paymentsValue / 100) *
                rewardPercentage;
            require(
                address(this).balance >= calculatedReward,
                "Contract has not enough funds to pay rewards"
            );
            currentProcess.referrerAddress.transfer(calculatedReward);
            currentProcess.referralProcessCompleted = true;
            emit ReferralCompleted(_referee, currentProcess.referrerAddress);
        }
    }

    // update the process data
    function update(
        address _referee,
        address payable _referrer,
        uint _amount
    ) internal {
        ReferralProcess storage processToUpdate = refereeProcessMapping[
            _referee
        ];
        // referral process must not be completed
        require(
            !processToUpdate.referralProcessCompleted,
            "Referral process has been completed for this address"
        );
        // set and update values
        setReferrerAddress(_referee, _referrer);
        processToUpdate.paymentsValue += _amount;
        processToUpdate.paymentsQuantity += 1;
        emit ReferralConditionsUpdated(_referee);
    }
}
