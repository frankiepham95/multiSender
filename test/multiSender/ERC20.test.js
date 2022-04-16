const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/signers');
const { BigNumber, Contract, ContractFactory } = require('ethers');
const { starknet, network, ethers } = require('hardhat');

const { expect } = require('chai');
const { clearConfigCache } = require('prettier');

contract('ERC20', function () {
  let tokenOwner;
  let tokenReceiver_1;
  let erc20ContractOwner;

  let multiSenderContract;
  let erc20Contract;

  before(async function () {
    const signers = await ethers.getSigners();

    tokenOwner = signers[0];

    tokenReceiver_1 = signers[1];

    erc20ContractOwner = signers[2];

    //deploy erc20 contract
    let erc20MintableFactory = await ethers.getContractFactory('ERC20Mintable', erc20ContractOwner);

    erc20Contract = await erc20MintableFactory.deploy();
    await erc20Contract.deployed();

    erc20Contract.connect();
    //get and deploy multiSender contract
    let multiSenderFactory = await ethers.getContractFactory('multiSender', tokenOwner);
    multiSenderContract = await multiSenderFactory.deploy();
    await multiSenderContract.deployed();
  });

  it('mint', async function () {
    console.log('minting NFT');
    await erc20Contract.mint(tokenOwner.address, 9999);
    let balance = await erc20Contract.balanceOf(tokenOwner.address);
    console.log("tokenOwner's balance: ", balance);
  });

  it('approve for transfer', async function () {
    // erc20Contract;
    // await erc20Contract.mint(tokenOwner.address, 9999);
    erc20Contract = await erc20Contract.connect(tokenOwner);
    await erc20Contract.transfer(tokenReceiver_1.address, 333);
    let balance = await erc20Contract.balanceOf(tokenOwner.address);
    console.log("tokenOwner's balance: ", balance);
  });
});
