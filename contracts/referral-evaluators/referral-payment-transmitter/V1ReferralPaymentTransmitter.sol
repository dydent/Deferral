// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract V1ReferralPaymentTransmitter is Ownable {
    // address of the payment receiver
    address payable public receiver;

    // price / amount that the payment has to be
    uint256 public paymentAmount;

    // value of the referral reward that is a portion of the paymentAmount
    uint256 public referralReward;

    // modifier to guarantee the exact amount
    modifier exactAmount() {
        require(
            msg.value == paymentAmount,
            "tx must send exact payment amount"
        );
        _;
    }

    // Referral Event to be emitted once a referral process has been completed
    event Referral(address indexed referrer, address indexed referee);

    // Update events if variables get updated
    event ReceiverUpdated(
        address indexed oldReceiver,
        address indexed newReceiver
    );
    event PaymentAmountUpdated(uint256 oldPrice, uint256 newPrice);
    event ReferralRewardUpdated(uint256 oldReward, uint256 newReward);

    // constructor function to initialize receiver address and the referral amounts --> i.e. referral conditions
    constructor(
        address payable _receiver,
        uint256 _amount,
        uint256 _referralReward
    ) {
        require(
            _amount > _referralReward,
            "reward must be portion of paymentAmount"
        );
        receiver = _receiver;
        paymentAmount = _amount;
        referralReward = _referralReward;
    }

    // forward paymentAmount to the receiver and send referralReward to the referrerAddress
    function forwardReferralPayment(
        address payable _referrerAddress
    ) external payable exactAmount {
        uint256 receiverAmount = msg.value - referralReward;
        uint256 referrerRewardAmount = msg.value - receiverAmount;
        // forward payment to receiver
        receiver.transfer(receiverAmount);
        // send referral rewards to referrer
        _referrerAddress.transfer(referrerRewardAmount);
        emit Referral(_referrerAddress, msg.sender);
    }

    // function to update the receiver address
    function updateReceiverAddress(
        address payable _newReceiverAddress
    ) public onlyOwner {
        address oldReceiver = receiver;
        receiver = _newReceiverAddress;
        emit ReceiverUpdated(oldReceiver, _newReceiverAddress);
    }

    // function to update the referral payment amount
    function updatePaymentAmount(uint256 _newPaymentAmount) public onlyOwner {
        require(
            referralReward < _newPaymentAmount,
            "reward must be portion of paymentAmount"
        );
        uint256 oldPaymentAmount = paymentAmount;
        paymentAmount = _newPaymentAmount;
        emit PaymentAmountUpdated(oldPaymentAmount, _newPaymentAmount);
    }

    // function to update the referral reward
    function updateReferralReward(uint256 _newReferralReward) public onlyOwner {
        require(
            paymentAmount > _newReferralReward,
            "reward must be portion of paymentAmount"
        );
        uint256 oldReferralReward = referralReward;
        referralReward = _newReferralReward;
        emit ReferralRewardUpdated(oldReferralReward, _newReferralReward);
    }
}
