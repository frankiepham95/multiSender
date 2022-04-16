// SPDX-License-Identifier: MIT
// Thai_Pham Contracts

pragma solidity ^0.8.0;

import "../token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract multiSender {
    constructor() {}

    function sendERC20(
        address token,
        address[] memory receiver,
        uint256[] memory amount
    ) public virtual returns (bool) {
        IERC20 erc20Contract = IERC20(token);
        require(receiver.length <= 100, "receiver list is overload! please give a list smaller than 100");
        require(receiver.length == amount.length, "lacking of amount infomation, please check again!");
        //TODO: REQUIRE TOTAL AMOUNT
        for (uint256 j = 0; j < receiver.length; j++) {
            erc20Contract.transferFrom(msg.sender, receiver[j], amount[j]);
        }

        return true;
    }
}
