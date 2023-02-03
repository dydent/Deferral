// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ReferralEvaluator.sol";


// Referral Evaluator Contract for Proxy Payments
contract PaymentProxyReferral is ReferralEvaluator {
    mapping(address => uint256) public referralPaymentAddresses;

    constructor(address payable _recipient) public {
        recipient = _recipient;
    }


    function forwardPayment(uint256 value) public payable {

        referralPaymentAddresses[msg.sender] += value;

        emit PaymentReceived(msg.sender, value);

    }

    function getPaymentCount(address sender) public view returns (uint256) {
        return referralPaymentAddresses[sender];
    }
}
