// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// combines referral conditions for payments quantity and payments accumulated value
// conditions when evaluating the referral process
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V1ReferralMultilevelRewardsUpgradable is
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
    event ReferralRewardsDistributed(address indexed referrer);
    event ReferralConditionsUpdated(address indexed referee);
    event RootReferrerRegistered(address indexed rootAddress);
    // events when owner is updating contracts variables
    event ReceiverAddressChanged(address indexed newReceiver);
    event RewardPercentageChanged(uint256 newReward);
    event PaymentsValueThresholdChanged(uint256 newValueThreshold);
    event PaymentsQuantityThresholdChanged(uint256 newQuantityThreshold);

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
        ReferralProcess storage completedProcess = refereeProcessMapping[
            _referee
        ];
        // calculate the reward for the referrer
        uint256 calculatedReferrerReward = (completedProcess.paymentsValue /
            100) * rewardPercentage;
        // get all address that are eligible for rewards
        require(
            address(this).balance >= calculatedReferrerReward,
            "Contract has not enough funds to pay rewards"
        );
        // get all eligible referral addresses
        address payable[]
            memory rewardAddresses = getAllParentReferrerAddresses(_referee);

        // calculate reward per referrer
        uint256 numberOfRewardAddresses = rewardAddresses.length;

        uint256 rewardProportion = calculatedReferrerReward /
            numberOfRewardAddresses;

        uint256 i = 0;
        // distribute rewards to all referrers
        while (i < numberOfRewardAddresses) {
            rewardAddresses[i].transfer(rewardProportion);
            emit ReferralRewardsDistributed(rewardAddresses[i]);
            i++;
        }
    }

    function getAllParentReferrerAddresses(
        address _referee
    ) internal view returns (address payable[] memory) {
        uint256 length = 0;
        address currentRefereeAddress = _referee;
        //        loop until get to root address
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
        require(msg.sender != _referrerAddress, "Sender cannot be referrer");

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
        uint256 _paymentsQuantityThreshold,
        uint256 _paymentsValueThreshold
    ) public initializer {
        require(
            _rewardPercentage >= 0 && _rewardPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        __Ownable_init();
        receiverAddress = _receiverAddress;
        rewardPercentage = _rewardPercentage;
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
            "percentage value must be between 0 and 100"
        );
        rewardPercentage = _newReferralReward;
        emit RewardPercentageChanged(_newReferralReward);
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
