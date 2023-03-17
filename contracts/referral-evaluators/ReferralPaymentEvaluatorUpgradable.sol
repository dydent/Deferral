// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// combines referral conditions for payments quantity and payments accumulated value conditions when evaluating the referral process
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ReferralPaymentEvaluatorUpgradable is
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
        // set true if the referral has been successful & rewards have been paid out
        bool referralProcessCompleted;
        // set true if the parent referrer address has been set
        bool referrerAddressHasBeenSet;
        address payable parentReferrerAddress;
        uint paymentsValue;
        uint paymentsQuantity;
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
    // events when owner is updating contracts variables
    event ReceiverAddressChanged(address indexed newReceiver);
    event RewardPercentageChanged(uint256 newReward);
    event paymentsValueThresholdChanged(uint256 newValueThreshold);
    event paymentsQuantityThresholdChanged(uint256 newQuantityThreshold);

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
            // calculate the reward for the referrer
            uint256 calculatedReferrerReward = (refereeProcess.paymentsValue /
                100) * rewardPercentage;
            // TODO if two-sided rewards, calculate the referee reward that can be claimed
            // TODO check and implement multiple ways where and how the rewards are stored and distributed
            require(
                address(this).balance >= calculatedReferrerReward,
                "Contract has not enough funds to pay rewards"
            );
            // distribute and allocate rewards
            refereeProcess.parentReferrerAddress.transfer(
                calculatedReferrerReward
            );
            emit ReferralRewardsDistributed(
                refereeProcess.parentReferrerAddress
            );
            // referral process is completed
            refereeProcess.referralProcessCompleted = true;
            emit ReferralCompleted(_referee);
        }
    }

    function forwardPayment(uint256 _paymentValue) internal {
        // calculate referral reward and payment amount that has to be forwarded
        uint256 receiverAmount = _paymentValue -
            ((_paymentValue / 100) * rewardPercentage);
        receiverAddress.transfer(receiverAmount);
    }

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // register & forward payment and update referral process data
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
        // update referral process with payment
        updateReferralProcess(msg.sender, _referrerAddress, msg.value);
        // evaluate updated referral process
        evaluateReferralProcess(msg.sender);
        // forward value to the receiver address
        forwardPayment(msg.value);
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
            "reward percentage must be between 0 and 100"
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
            "reward percentage must be between 0 and 100"
        );
        rewardPercentage = _newReferralReward;
        emit RewardPercentageChanged(_newReferralReward);
    }

    function updatePaymentsQuantityThreshold(
        uint256 _newPaymentsQuantityThreshold
    ) public onlyOwner {
        paymentsQuantityThreshold = _newPaymentsQuantityThreshold;
        emit paymentsQuantityThresholdChanged(_newPaymentsQuantityThreshold);
    }

    function updatePaymentsValueThreshold(
        uint256 _newPaymentsValueThreshold
    ) public onlyOwner {
        paymentsValueThreshold = _newPaymentsValueThreshold;
        emit paymentsValueThresholdChanged(_newPaymentsValueThreshold);
    }
}
