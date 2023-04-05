// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// Use claimable rewards instead of sending reward directly
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V2ReferralPaymentValueUpgradable is Initializable, OwnableUpgradeable {
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // address of the receiver/company wallet
    address payable public receiverAddress;
    // percentage of the total paid amount that will be distributed as reward
    uint256 public rewardPercentage;
    // percentage of the reward that will be distributed to the referee
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

    // mapping for claimable referral rewards
    mapping(address => uint256) public claimableRewardMapping;

    // -----------------------------------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------------------------------

    // Referral Event to be emitted once a referral process has been completed
    event ReferralCompleted(address indexed referee, address indexed referrer);
    event ReferralConditionsUpdated(address indexed referee);
    event ReceiverUpdated(address indexed newReceiver);
    event RewardUpdated(uint256 newReward);
    event ValueThresholdUpdated(uint256 newValueThreshold);

    event ReferralRewardsAllocated(address indexed allocatedAddress);
    event ClaimedRewards(address indexed claimerAddress, uint256 amount);

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
                claimableRewardMapping[_referrerAddress] += calculatedReward;
                emit ReferralRewardsAllocated(_referrerAddress);
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

    function claimRewards() public {
        uint256 rewards = claimableRewardMapping[msg.sender];
        require(rewards > 0, "No rewards to claim");
        claimableRewardMapping[msg.sender] = 0;
        payable(msg.sender).transfer(rewards);
        emit ClaimedRewards(msg.sender, rewards);
    }

    function initialize(
        address payable _receiver,
        uint256 _rewardPercentage,
        uint256 _valueThreshold
    ) public initializer {
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiver;
        rewardPercentage = _rewardPercentage;
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

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
