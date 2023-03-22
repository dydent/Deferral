// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// add two-sided rewards and make referee rewards claimable
// allow to do regular payments for completed referral processes and forward payments
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "hardhat/console.sol";

contract V2MultilevelRewardReferralUpgradable is
    Initializable,
    OwnableUpgradeable
{
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // address of the payment receiver wallet
    address payable public receiverAddress;
    // percentage (0 - 100) of the paid amount that is distributed as referral reward upon completion
    uint256 public rewardPercentage;
    // percentage (0 - 100) of the earned reward that is distributed to the referee --> complement is referrer reward percentage
    uint256 public refereeRewardAllocationPercentage;
    // required amount of payments in order to successfully complete referral process
    uint256 public paymentsQuantityThreshold;
    // required accumulated value of payments in order to successfully complete referral process
    uint256 public paymentsValueThreshold;

    // referral conditions required for evaluating the referral process
    struct ReferralProcess {
        // set true if no referrer has been passed and address is registered as top level root
        bool isRoot;
        // set true if the referral has been successful & rewards have been paid out
        bool referralProcessCompleted;
        // set true if the parent referrer address has been set
        bool referrerAddressHasBeenSet;
        address payable parentReferrerAddress;
        uint256 paymentsValue;
        uint256 paymentsQuantity;
    }

    // mapping for referees including their data for referral conditions progress
    mapping(address => ReferralProcess) public refereeProcessMapping;

    // mapping for claimable referral rewards
    mapping(address => uint256) public claimableRefereesRewardMapping;

    // -----------------------------------------------------------------------------------------------
    // EVENTS
    // -----------------------------------------------------------------------------------------------

    // creation of a payment referral contract
    event PaymentReferralCreated(
        address indexed owner,
        address indexed receiverAddress
    );
    // referee has completed a referral process
    event ReferralCompleted(address indexed referee);
    // referrer has received referral rewards
    event ReferralRewardsAllocated(address indexed allocatedAddress);
    event ReferralRewardsDistributed(address indexed distributedAddress);
    event ReferralConditionsUpdated(address indexed referee);
    event RootReferrerRegistered(address indexed rootAddress);
    event ClaimedRewards(address indexed claimerAddress, uint256 amount);
    // events when owner is updating contracts variables
    event ReceiverAddressChanged(address indexed newReceiver);
    event RewardPercentageChanged(uint256 newReward);
    event PaymentsValueThresholdChanged(uint256 newValueThreshold);
    event PaymentsQuantityThresholdChanged(uint256 newQuantityThreshold);
    event RefereeRewardAllocationPercentageChanged(
        uint256 newRefereeRewardAllocation
    );

    // -----------------------------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // update the process data
    function updateReferralProcess(
        address _referee,
        address payable _referrer,
        uint _paymentValue
    ) internal {
        ReferralProcess storage refereeProcess = refereeProcessMapping[
            _referee
        ];
        // referral process must not be completed
        require(
            !refereeProcess.referralProcessCompleted,
            "Referral process has been completed for this address"
        );
        // set and update values
        if (!refereeProcess.referrerAddressHasBeenSet) {
            refereeProcess.parentReferrerAddress = _referrer;
            refereeProcess.referrerAddressHasBeenSet = true;
        }
        refereeProcess.paymentsValue += _paymentValue;
        refereeProcess.paymentsQuantity += 1;
        emit ReferralConditionsUpdated(_referee);
    }

    function evaluateReferralProcess(address _referee) internal {
        ReferralProcess storage refereeProcess = refereeProcessMapping[
            _referee
        ];
        // require referrer address has been set
        require(
            refereeProcess.referrerAddressHasBeenSet,
            "Referrer Address has not been set for this referee"
        );
        // check if thresholds for payments value and quantity are surpassed
        if (
            refereeProcess.paymentsValue > paymentsValueThreshold &&
            refereeProcess.paymentsQuantity > paymentsQuantityThreshold
        ) {
            distributeRewards(_referee);
            // referral process is completed
            refereeProcess.referralProcessCompleted = true;
            emit ReferralCompleted(_referee);
        }
    }

    function distributeRewards(address _referee) internal {
        ReferralProcess storage refereeCompletedProcess = refereeProcessMapping[
            _referee
        ];
        // calculate the total reward based on the referee payment value/volume
        uint256 calculatedTotalReward = (refereeCompletedProcess.paymentsValue /
            100) * rewardPercentage;
        require(
            address(this).balance >= calculatedTotalReward,
            "Contract has not enough funds to pay rewards"
        );
        // calculate and allocate claimable referee rewards
        uint256 refereeReward = (calculatedTotalReward / 100) *
            refereeRewardAllocationPercentage;
        claimableRefereesRewardMapping[_referee] += refereeReward;
        emit ReferralRewardsAllocated(_referee);

        // calculate remaining referrer rewards
        uint256 referrerReward = calculatedTotalReward - refereeReward;
        // get all eligible referral addresses
        address payable[]
            memory rewardAddresses = getAllParentReferrerAddresses(_referee);
        // calculate reward per referrer in reward chain
        uint256 numberOfRewardAddresses = rewardAddresses.length;
        uint256 referrerRewardProportion = referrerReward /
            numberOfRewardAddresses;
        uint256 i = 0;
        // distribute rewards to all eligible referrers
        while (i < numberOfRewardAddresses) {
            rewardAddresses[i].transfer(referrerRewardProportion);
            emit ReferralRewardsDistributed(rewardAddresses[i]);
            i++;
        }
    }

    function getAllParentReferrerAddresses(
        address _referee
    ) internal view returns (address payable[] memory) {
        uint256 length = 0;
        address currentRefereeAddress = _referee;
        // loop until get to root address
        while (refereeProcessMapping[currentRefereeAddress].isRoot != true) {
            length++;
            currentRefereeAddress = refereeProcessMapping[currentRefereeAddress]
                .parentReferrerAddress;
        }

        address payable[]
            memory parentReferrerAddresses = new address payable[](length);

        currentRefereeAddress = _referee;
        for (uint256 i = 0; i < length; i++) {
            parentReferrerAddresses[i] = refereeProcessMapping[
                currentRefereeAddress
            ].parentReferrerAddress;
            currentRefereeAddress = parentReferrerAddresses[i];
        }

        return parentReferrerAddresses;
    }

    function forwardPayment(uint256 _paymentValue) internal {
        // forward payment value to receiver
        receiverAddress.transfer(_paymentValue);
    }

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    function claimRewards() public {
        uint256 rewards = claimableRefereesRewardMapping[msg.sender];
        require(rewards > 0, "You have no rewards to claim");
        payable(msg.sender).transfer(rewards);
        claimableRefereesRewardMapping[msg.sender] = 0;
        emit ClaimedRewards(msg.sender, rewards);
    }

    // overload function for referral payments without a referrer address
    function registerReferralPayment() external payable {
        ReferralProcess storage refereeProcess = refereeProcessMapping[
            msg.sender
        ];
        // check if sender is validly registered as referee --> update referral process data and
        if (
            !refereeProcess.isRoot && refereeProcess.referrerAddressHasBeenSet
        ) {
            // update referral process with payment
            updateReferralProcess(
                msg.sender,
                refereeProcess.parentReferrerAddress,
                msg.value
            );
            // evaluate updated referral process
            evaluateReferralProcess(msg.sender);
            // forward value to the receiver address
            forwardPayment(msg.value - (msg.value / 100) * rewardPercentage);
        }
        // else sender is root or new root referrer
        else {
            // if sender not yet registered as root --> register
            if (
                !refereeProcess.referrerAddressHasBeenSet &&
                !refereeProcess.isRoot
            ) {
                // register address as new root address
                refereeProcess.isRoot = true;
                emit RootReferrerRegistered(msg.sender);
            }
            // update data for root address
            refereeProcess.paymentsValue += msg.value;
            refereeProcess.paymentsQuantity += 1;
            // forward whole payment
            forwardPayment(msg.value);
        }
    }

    // register & forward payment and update referral process data
    function registerReferralPayment(
        address payable _referrerAddress
    ) external payable {
        // sender cannot use its own address as referrer
        require(
            msg.sender != _referrerAddress,
            "Sender address cannot be used as referrer address"
        );
        // check preconditions for _referrerAddress

        // get current referrer process data
        ReferralProcess storage referrerProcess = refereeProcessMapping[
            _referrerAddress
        ];
        // referrer address must be registered address --< root referrer or other registered referee
        require(
            referrerProcess.isRoot || referrerProcess.referrerAddressHasBeenSet,
            "Referrer must be a registered address"
        );

        // check preconditions for sender address (referee)

        // get current referee process data
        ReferralProcess storage currentProcess = refereeProcessMapping[
            msg.sender
        ];
        // address cannot be root & referral process must not be completed
        require(!currentProcess.isRoot, "Root address cannot be a referee");
        require(
            !currentProcess.referralProcessCompleted,
            "Referral process has been completed for this address"
        );

        // update referral process with payment
        updateReferralProcess(msg.sender, _referrerAddress, msg.value);
        // evaluate updated referral process
        evaluateReferralProcess(msg.sender);
        // forward value to the receiver address
        forwardPayment(msg.value - (msg.value / 100) * rewardPercentage);
    }

    // create upgradable contract
    function initialize(
        address payable _receiverAddress,
        uint256 _rewardPercentage,
        uint256 _refereeRewardAllocationPercentage,
        uint256 _paymentsQuantityThreshold,
        uint256 _paymentsValueThreshold
    ) public initializer {
        // percentage values must be between 0 and 100
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "reward percentage must be between 0 and 100"
        );
        require(
            _refereeRewardAllocationPercentage >= 0 &&
                _refereeRewardAllocationPercentage <= 100,
            "referee reward allocation percentage must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiverAddress;
        rewardPercentage = _rewardPercentage;
        refereeRewardAllocationPercentage = _refereeRewardAllocationPercentage;
        paymentsQuantityThreshold = _paymentsQuantityThreshold;
        paymentsValueThreshold = _paymentsValueThreshold;
        emit PaymentReferralCreated(msg.sender, _receiverAddress);
    }

    // view functions do only read and not update any data of a contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // -----------------------------------------------------------------------------------------------
    // updating contract variables (only contract owner can update these)
    // -----------------------------------------------------------------------------------------------

    function updateReceiverAddress(
        address payable _updatedReceiverAddress
    ) public onlyOwner {
        receiverAddress = _updatedReceiverAddress;
        emit ReceiverAddressChanged(_updatedReceiverAddress);
    }

    function updateReferralReward(uint256 _newReferralReward) public onlyOwner {
        require(
            _newReferralReward >= 0 && _newReferralReward <= 100,
            "reward percentage must be between 0 and 100"
        );
        rewardPercentage = _newReferralReward;
        emit RewardPercentageChanged(_newReferralReward);
    }

    function updateRefereeRewardAllocation(
        uint256 _newRefereeRewardAllocationPercentage
    ) public onlyOwner {
        require(
            _newRefereeRewardAllocationPercentage >= 0 &&
                _newRefereeRewardAllocationPercentage <= 100,
            "referee reward allocation percentage must be between 0 and 100"
        );
        refereeRewardAllocationPercentage = _newRefereeRewardAllocationPercentage;
        emit RefereeRewardAllocationPercentageChanged(
            _newRefereeRewardAllocationPercentage
        );
    }

    function updatePaymentsQuantityThreshold(
        uint256 _newPaymentsQuantityThreshold
    ) public onlyOwner {
        paymentsQuantityThreshold = _newPaymentsQuantityThreshold;
        emit PaymentsQuantityThresholdChanged(_newPaymentsQuantityThreshold);
    }

    function updatePaymentsValueThreshold(
        uint256 _newPaymentsValueThreshold
    ) public onlyOwner {
        paymentsValueThreshold = _newPaymentsValueThreshold;
        emit PaymentsValueThresholdChanged(_newPaymentsValueThreshold);
    }
}
