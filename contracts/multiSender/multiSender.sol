// SPDX-License-Identifier: MIT
// Thai_Pham Contracts

pragma solidity ^0.8.0;

import "../token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract multiSender {
    constructor() {}

    function sendERC20(
        address token,
        address receiver,
        uint256 amount
    ) public virtual returns (uint256) {
        IERC20 erc20Contract = IERC20(token);
        erc20Contract.transferFrom(msg.sender, receiver, amount);
        uint256 balance = erc20Contract.balanceOf(receiver);
        console.log("balance:", balance);
        return balance;
    }
}
