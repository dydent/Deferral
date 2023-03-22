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

    // address of the receiver wallet
    address payable public receiverAddress;
    // percentage of the paid amount that is distributed as referral reward upon completion
    uint256 public rewardPercentage;
    // required amount of payments in order to successfully complete referral process
    uint256 public valueThreshold;
    //   referral conditions required for evaluating the referral process
    struct ReferralProcess {
        // set true if the referral has been successful & rewards have been paid out
        bool referralProcessCompleted;
        // set true if the referrer address has been set
        bool referrerAddressHasBeenSet;
        address payable referrerAddress;
        uint paidValue;
        uint paymentQuantity;
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

    // forward paymentAmount to the receiver and send referralReward to the referrerAddress
    function registerReferralPayment(
        address payable _referrerAddress
    ) external payable {
        // get current referee process data
        ReferralProcess storage currentProcess = refereeProcessMapping[
            msg.sender
        ];
        // referral process must not be completed
        require(
            !currentProcess.referralProcessCompleted,
            "Referral process has been completed for this address"
        );
        // referral reward must be smaller than msg value
        require(
            (msg.value / 100) * rewardPercentage < msg.value,
            "reward must be portion of paymentAmount"
        );
        //  set referrer address first time
        if (!currentProcess.referrerAddressHasBeenSet) {
            // update values
            currentProcess.referrerAddress = _referrerAddress;
            currentProcess.referrerAddressHasBeenSet = true;
        }
        // set and update values
        currentProcess.paidValue += msg.value;
        currentProcess.paymentQuantity += 1;
        emit ReferralConditionsUpdated(msg.sender);
        // evaluate referral process and progress
        if (currentProcess.paidValue > valueThreshold) {
            uint256 calculatedReward = (currentProcess.paidValue / 100) *
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
        require(rewards > 0, "You have no rewards to claim");
        payable(msg.sender).transfer(rewards);
        claimableRewardMapping[msg.sender] = 0;
        emit ClaimedRewards(msg.sender, rewards);
    }

    function initialize(
        address payable _receiver,
        uint256 _rewardPercentage,
        uint256 _valueThreshold
    ) public initializer {
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "reward percentage must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiver;
        rewardPercentage = _rewardPercentage;
        valueThreshold = _valueThreshold;
    }

    // function to update the receiver address
    function updateReceiverAddress(
        address payable _updatedReceiverAddress
    ) public onlyOwner {
        receiverAddress = _updatedReceiverAddress;
        emit ReceiverUpdated(_updatedReceiverAddress);
    }

    // function to update the referral reward
    function updateReferralReward(uint256 _newReferralReward) public onlyOwner {
        require(
            _newReferralReward >= 0 && _newReferralReward <= 100,
            "reward percentage must be between 0 and 100"
        );
        rewardPercentage = _newReferralReward;
        emit RewardUpdated(_newReferralReward);
    }

    // function to update the referral reward
    function updateValueThreshold(uint256 _newValueThreshold) public onlyOwner {
        valueThreshold = _newValueThreshold;
        emit ValueThresholdUpdated(_newValueThreshold);
    }

    // view functions do only read and not update any data of a contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
