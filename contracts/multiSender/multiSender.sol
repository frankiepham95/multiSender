// SPDX-License-Identifier: MIT
// Thai_Pham Contracts

pragma solidity ^0.8.0;

import "../token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract multiSender {
    constructor() {}

    function sendERC20(address token) public virtual returns (uint256) {
        console.log("hello");
        // IERC20 erc20Contract = IERC20(token);
        // uint256 balance = erc20Contract.balanceOf(msg.sender);
        // console.log("balance: ", balance);
        // return balance;
        return 123;
    }
}
