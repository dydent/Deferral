// -----------------------------------------------------------------------------------------------
// UPGRADABLE CONTRACT
// -----------------------------------------------------------------------------------------------

// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.9;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract V2ReferralPaymentTransmitterUpgradable is
    Initializable,
    OwnableUpgradeable
{
    // address of the payment receiver
    address payable public receiver;

    // price / amount that the payment has to be
    uint256 public paymentAmount;

    // value of the referral reward that is a portion of the paymentAmount
    uint256 public referralReward;

    // upgradable-contracts initializer --> set receiver address and referral conditions
    function initialize(
        address payable _receiver,
        uint256 _amount,
        uint256 _referralReward
    ) public initializer {
        // set owner
        __Ownable_init();
        require(
            _amount > _referralReward,
            "reward must be portion of paymentAmount"
        );
        receiver = _receiver;
        paymentAmount = _amount;
        referralReward = _referralReward;
    }
}
