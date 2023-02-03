pragma solidity ^0.8.0;

// Abstract parent referral evaluator contract
contract ReferralEvaluator {
    address payable recipient;

    function forwardPayment(address payable _recipient) public virtual;

    function() public payable virtual;
}
