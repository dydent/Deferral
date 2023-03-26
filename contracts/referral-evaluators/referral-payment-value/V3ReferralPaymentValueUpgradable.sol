// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// Use two-sided rewards and send all rewards directly
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V3ReferralPaymentValueUpgradable is Initializable, OwnableUpgradeable {
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // address of the receiver/company wallet
    address payable public receiverAddress;
    // percentage of the total paid amount that will be distributed as reward
    uint256 public rewardPercentage;
    // percentage of the reward that will be distributed to the referee
    uint256 public refereeRewardPercentage;
    // accumulate value threshold of payments done by the referee to complete referral process
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

    // mapping for referees including their referral process data
    mapping(address => ReferralProcess) public refereeProcessMapping;

    // -----------------------------------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------------------------------
    event ReferralCompleted(address indexed referee, address indexed referrer);
    event ReferralConditionsUpdated(address indexed referee);
    event ReceiverUpdated(address indexed newReceiver);
    event RewardUpdated(uint256 newReward);
    event ValueThresholdUpdated(uint256 newValueThreshold);
    event RefereeRewardAllocationPercentageChanged(
        uint256 newRefereeRewardAllocation
    );

    event RefereeRewardsDistributed(address indexed distributedAddress);
    event ReferrerRewardsDistributed(address indexed distributedAddress);

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // forward paymentAmount to the receiver and send referralReward to the referrerAddress
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
            // calculate the total reward based on the referee payment value/volume
            uint256 calculatedTotalReward = (currentProcess.paymentsValue /
                100) * rewardPercentage;
            require(
                address(this).balance >= calculatedTotalReward,
                "Contract has not enough funds to pay rewards"
            );

            // calculate referee & referrer rewards from total reward
            uint256 refereeReward = (calculatedTotalReward / 100) *
                refereeRewardPercentage;
            uint256 referrerReward = calculatedTotalReward - refereeReward;

            // if reward allocation is two sided send rewards to referee
            if (refereeReward > 0 && refereeRewardPercentage > 0) {
                payable(msg.sender).transfer(refereeReward);
                emit RefereeRewardsDistributed(msg.sender);
            }
            // send rewards to referrer
            _referrerAddress.transfer(referrerReward);
            emit ReferrerRewardsDistributed(_referrerAddress);
            // mark process as completed
            currentProcess.referralProcessCompleted = true;
            emit ReferralCompleted(msg.sender, _referrerAddress);
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
        uint256 _refereeRewardAllocationPercentage,
        uint256 _valueThreshold
    ) public initializer {
        // percentage values must be between 0 and 100
        require(
            _rewardPercentage >= 0 &&
                _rewardPercentage <= 100 &&
                _refereeRewardAllocationPercentage >= 0 &&
                _refereeRewardAllocationPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiver;
        rewardPercentage = _rewardPercentage;
        refereeRewardPercentage = _refereeRewardAllocationPercentage;
        paymentsValueThreshold = _valueThreshold;
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

    function updateValueThreshold(uint256 _newValueThreshold) public onlyOwner {
        paymentsValueThreshold = _newValueThreshold;
        emit ValueThresholdUpdated(_newValueThreshold);
    }

    function updateRefereeReward(
        uint256 _newRefereeRewardAllocationPercentage
    ) public onlyOwner {
        require(
            _newRefereeRewardAllocationPercentage >= 0 &&
                _newRefereeRewardAllocationPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        refereeRewardPercentage = _newRefereeRewardAllocationPercentage;
        emit RefereeRewardAllocationPercentageChanged(
            _newRefereeRewardAllocationPercentage
        );
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
