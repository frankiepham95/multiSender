// SPDX-License-Identifier: MIT
// Thai_Pham Contracts

pragma solidity ^0.8.0;

import "../token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract multiSender {
    event Multisended(uint256 total, address tokenAddress);

    constructor() {}

    function sendERC20(
        address token,
        address[] memory _receiver,
        uint256[] memory _amount
    ) public virtual returns (bool) {
        uint256 totalSend = 0;
        IERC20 erc20Contract = IERC20(token);
        require(_receiver.length <= 100, "receiver list is overload! please give a list smaller than 100");
        require(_receiver.length == _amount.length, "lacking of amount infomation, please check again!");
        //TODO: REQUIRE TOTAL AMOUNT
        for (uint256 j = 0; j < _receiver.length; j++) {
            erc20Contract.transferFrom(msg.sender, _receiver[j], _amount[j]);
            totalSend += _amount[j];
        }
        emit Multisended(totalSend, token);
        return true;
    }

    function sendEther(address[] memory _receiver, uint256[] memory _amount) public payable virtual returns (bool) {
        require(_receiver.length <= 100, "receiver list is overload! please give a list smaller than 100");
        require(_receiver.length == _amount.length, "lacking of amount infomation, please check again!");
        //TODO: REQUIRE TOTAL AMOUNT
        for (uint256 i = 0; i < _receiver.length; i++) {
            (bool success, ) = payable(_receiver[i]).call{value: _amount[i]}("");
            require(success, "Transfer failed.");
        }

        return true;
    }
}
