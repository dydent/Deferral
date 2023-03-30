// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// use token for payments
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract V3ReferralMultilevelRewardsUpgradable is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // -----------------------------------------------------------------------------------------------
    // VARS, STRUCTS & MAPPINGS
    // -----------------------------------------------------------------------------------------------

    // token / currency that is accepted for payments
    IERC20 public token;
    // address of the payment receiver wallet
    address payable public receiverAddress;
    // percentage (0 - 100) of the paid amount that is distributed as referral reward upon completion
    uint256 public rewardPercentage;
    // percentage of the reward that will be distributed to the referee
    uint256 public refereeRewardPercentage;
    // required amount of payments in order to successfully complete referral process
    uint256 public paymentsQuantityThreshold;
    // required accumulated value of payments in order to successfully complete referral process
    uint256 public paymentsValueThreshold;
    // max nr of parent referrers (levels) up in the referral chain for which rewards will be distributed (MIN: 1)
    uint256 public maxRewardLevels;

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
        IERC20 token,
        address indexed owner,
        address indexed receiverAddress,
        uint256 referralPercentage
    );
    // referee has completed a referral process
    event ReferralCompleted(address indexed referee);
    // referrer has received referral rewards
    event RefereeRewardsDistributed(
        address indexed refereeAddress,
        uint256 amount
    );
    event ReferralRewardsDistributed(
        address indexed distributedAddress,
        uint256 rewardAmount
    );
    event ReferralConditionsUpdated(address indexed referee);
    event RootReferrerRegistered(address indexed rootAddress);
    event PaymentRegistered(address indexed sender, uint256 amount);
    event PaymentForwarded(address indexed receiverAddress, uint256 amount);
    // events when owner is updating contracts variables
    event ReferralTokenUpdated(IERC20 _newToken);
    event ReceiverAddressChanged(address indexed newReceiver);
    event RewardPercentageChanged(uint256 newReward);
    event RefereeRewardPercentageChanged(uint256 newRefereeRewardPercentage);
    event PaymentsValueThresholdChanged(uint256 newValueThreshold);
    event PaymentsQuantityThresholdChanged(uint256 newQuantityThreshold);
    event MaxRewardLevelsChanged(uint256 newMaxRewardLevels);

    // -----------------------------------------------------------------------------------------------
    // INTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------

    // update the process data
    function updateReferralProcess(
        address _referee,
        address payable _referrer,
        uint256 _paymentValue
    ) internal {
        ReferralProcess storage refereeProcess = refereeProcessMapping[
            _referee
        ];
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

    function distributeRewards(address _referee) internal nonReentrant {
        ReferralProcess storage refereeCompletedProcess = refereeProcessMapping[
            _referee
        ];

        // calculate the total reward based on the referee payment value/volume
        uint256 calculatedTotalReward = (refereeCompletedProcess.paymentsValue *
            rewardPercentage) / 100;
        require(
            address(this).balance >= calculatedTotalReward,
            "Contract has not enough funds to pay rewards"
        );

        // calculate and distribute referee rewards
        uint256 refereeReward = (calculatedTotalReward *
            refereeRewardPercentage) / 100;
        token.transfer(_referee, refereeReward);
        emit RefereeRewardsDistributed(_referee, refereeReward);

        // calculate remaining referrer rewards
        uint256 referrerReward = calculatedTotalReward - refereeReward;
        // get all eligible referral addresses
        address payable[]
            memory rewardAddresses = getAllParentReferrerAddresses(_referee);

        // calculate reward per referrer in reward chain
        uint256 numberOfRewardAddresses = rewardAddresses.length;
        uint256 referrerRewardProportion = referrerReward /
            numberOfRewardAddresses;

        // distribute rewards to all eligible referrers
        for (uint256 i = 0; i < numberOfRewardAddresses; i++) {
            token.transfer(rewardAddresses[i], referrerRewardProportion);
            emit ReferralRewardsDistributed(
                rewardAddresses[i],
                referrerRewardProportion
            );
        }
    }

    function getAllParentReferrerAddresses(
        address _referee
    ) internal view returns (address payable[] memory parentReferrerAddresses) {
        uint256 length;
        address currentRefereeAddress = _referee;

        // loop until get to root address OR maxRewardLevels is reached
        while (
            refereeProcessMapping[currentRefereeAddress].isRoot != true &&
            length < maxRewardLevels
        ) {
            length++;
            currentRefereeAddress = refereeProcessMapping[currentRefereeAddress]
                .parentReferrerAddress;
        }

        parentReferrerAddresses = new address payable[](length);

        currentRefereeAddress = _referee;
        for (uint256 i = 0; i < length; i++) {
            parentReferrerAddresses[i] = refereeProcessMapping[
                currentRefereeAddress
            ].parentReferrerAddress;
            currentRefereeAddress = parentReferrerAddresses[i];
        }
        return parentReferrerAddresses;
    }

    function forwardPayment(uint256 _paymentValue) internal nonReentrant {
        // forward payment value to receiver
        receiverAddress.transfer(_paymentValue);
        emit PaymentForwarded(receiverAddress, _paymentValue);
    }

    // -----------------------------------------------------------------------------------------------
    // EXTERNAL FUNCTIONS
    // -----------------------------------------------------------------------------------------------
    // overload function for referral payments without a referrer address
    function registerReferralPayment(
        uint256 _paymentValue
    ) external nonReentrant {
        ReferralProcess storage refereeProcess = refereeProcessMapping[
            msg.sender
        ];
        // check if sender is validly registered as referee --> update referral process data and
        if (
            !refereeProcess.isRoot && refereeProcess.referrerAddressHasBeenSet
        ) {
            //            TODO fix this to:

            // Transfer tokens directly to the receiver
            //            token.transferFrom(msg.sender, receiverAddress, paymentValueAfterReward);

            // ...            // Transfer tokens from user to the contract
            token.transferFrom(msg.sender, address(this), _paymentValue);

            // update referral process with payment
            updateReferralProcess(
                msg.sender,
                refereeProcess.parentReferrerAddress,
                _paymentValue
            );
            // evaluate updated referral process
            evaluateReferralProcess(msg.sender);

            uint256 rewardPercentageValue = (_paymentValue * rewardPercentage) /
                100;
            uint256 paymentValueAfterReward = _paymentValue -
                rewardPercentageValue;

            // forward value to the receiver address

            forwardPayment(paymentValueAfterReward);
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
            refereeProcess.paymentsValue += _paymentValue;
            refereeProcess.paymentsQuantity += 1;
            // forward whole payment
            forwardPayment(_paymentValue);
        }
        emit PaymentRegistered(msg.sender, _paymentValue);
    }

    // register & forward payment and update referral process data
    function registerReferralPayment(
        address payable _referrerAddress,
        uint256 _paymentValue
    ) external nonReentrant {
        require(msg.sender != _referrerAddress, "Sender cannot be referrer");
        require(
            _referrerAddress != address(0),
            "address cannot be zero address"
        );
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

        // Transfer tokens from user to the contract
        token.transferFrom(msg.sender, address(this), _paymentValue);

        // update referral process with payment
        updateReferralProcess(msg.sender, _referrerAddress, _paymentValue);

        // evaluate updated referral process
        evaluateReferralProcess(msg.sender);

        uint256 rewardPercentageValue = (_paymentValue * rewardPercentage) /
            100;
        uint256 paymentValueAfterReward = _paymentValue - rewardPercentageValue;

        // forward value to the receiver address

        forwardPayment(paymentValueAfterReward);

        emit PaymentRegistered(msg.sender, _paymentValue);
    }

    // create upgradable contract
    function initialize(
        IERC20 _token,
        address payable _receiverAddress,
        uint256 _rewardPercentage,
        uint256 _refereeRewardPercentage,
        uint256 _paymentsQuantityThreshold,
        uint256 _paymentsValueThreshold,
        uint256 _maxRewardLevels
    ) public initializer {
        require(_maxRewardLevels >= 1, "minimum reward levels is 1");
        require(
            _receiverAddress != address(0),
            "address cannot be zero address"
        );
        require(
            _rewardPercentage >= 0 &&
                _rewardPercentage <= 100 &&
                _refereeRewardPercentage >= 0 &&
                _refereeRewardPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        __Ownable_init();
        token = _token;
        receiverAddress = _receiverAddress;
        rewardPercentage = _rewardPercentage;
        refereeRewardPercentage = _refereeRewardPercentage;
        paymentsQuantityThreshold = _paymentsQuantityThreshold;
        paymentsValueThreshold = _paymentsValueThreshold;
        paymentsValueThreshold = _paymentsValueThreshold;
        maxRewardLevels = _maxRewardLevels;
        emit PaymentReferralCreated(
            _token,
            msg.sender,
            _receiverAddress,
            _rewardPercentage
        );
    }

    // view functions do only read and not update any data of a contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // -----------------------------------------------------------------------------------------------
    // updating contract variables (only contract owner can update these)
    // -----------------------------------------------------------------------------------------------

    function updateReferralToken(IERC20 _updatedToken) public onlyOwner {
        token = _updatedToken;
        emit ReferralTokenUpdated(_updatedToken);
    }

    function updateReceiverAddress(
        address payable _updatedReceiverAddress
    ) public onlyOwner {
        require(
            _updatedReceiverAddress != address(0),
            "address cannot be zero address"
        );
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

    function updateRefereeReward(
        uint256 _newRefereeRewardPercentage
    ) public onlyOwner {
        require(
            _newRefereeRewardPercentage >= 0 &&
                _newRefereeRewardPercentage <= 100,
            "percentage value must be between 0 and 100"
        );
        refereeRewardPercentage = _newRefereeRewardPercentage;
        emit RefereeRewardPercentageChanged(_newRefereeRewardPercentage);
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

    function updateMaxRewardLevels(
        uint256 _newMaxRewardLevels
    ) public onlyOwner {
        require(_newMaxRewardLevels >= 1, "minimum reward levels is 1");
        maxRewardLevels = _newMaxRewardLevels;
        emit MaxRewardLevelsChanged(_newMaxRewardLevels);
    }
}
