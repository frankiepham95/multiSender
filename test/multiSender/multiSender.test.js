const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/signers');
const { BigNumber, Contract, ContractFactory } = require('ethers');
const { starknet, network, ethers } = require('hardhat');

const { expect } = require('chai');
const { clearConfigCache } = require('prettier');

contract('ERC20', function () {
  let tokenOwner;
  let tokenReceiver_1;
  let erc20_erc721_contractOwner;

  let multiSenderContract;
  let erc20Contract;
  let erc721Contract;
  let RECEIVERS;

  before(async function () {
    const signers = await ethers.getSigners();

    tokenOwner = signers[0];

    tokenReceiver_1 = signers[1];
    tokenReceiver_2 = signers[4];
    tokenReceiver_3 = signers[5];
    tokenReceiver_4 = signers[6];
    RECEIVERS = [tokenReceiver_1, tokenReceiver_2, tokenReceiver_3, tokenReceiver_4];

    erc20_erc721_contractOwner = signers[2];

    multiSenderOnwer = signers[3];

    //deploy erc20 contract
    let erc20MintableFactory = await ethers.getContractFactory('ERC20Mintable', erc20_erc721_contractOwner);

    erc20Contract = await erc20MintableFactory.deploy();
    await erc20Contract.deployed();

    erc20Contract.connect();
    //get and deploy multiSender contract
    let multiSenderFactory = await ethers.getContractFactory('multiSender', multiSenderOnwer);
    multiSenderContract = await multiSenderFactory.deploy();
    await multiSenderContract.deployed();

    //deploy erc721 contract
    let erc721Factory = await ethers.getContractFactory('ERC721MintableBurnable', erc20_erc721_contractOwner);
    erc721Contract = await erc721Factory.deploy('NFT', 'TNFT');
    await erc721Contract.deployed();
  });

  it('mint', async function () {
    console.log('minting erc20');
    await erc20Contract.mint(tokenOwner.address, 9999);
    let balance = await erc20Contract.balanceOf(tokenOwner.address);
    console.log("tokenOwner's balance: ", balance);
  });

  it('mint NFT', async function () {
    console.log('minting 100 test NFTS....!');
    for (let index = 0; index < 100; index++) {
      await erc721Contract.mint(tokenOwner.address, index, 'Qmb6tWBDLd9j2oSnvSNhE314WFL7SRpQNtfwjFWsStXp5A');
    }
    let balance = await erc721Contract.balanceOf(tokenOwner.address);
    console.log("tokenOwner's NFT balance: ", balance);
  });

  it('Send ERC20 token by multiSender contract', async function () {
    //send by tokenOwner
    console.log('sending erc20 tokens to multi-address.....');
    multiSenderContract = multiSenderContract.connect(tokenOwner);
    erc20Contract = await erc20Contract.connect(tokenOwner);

    let receiver = [tokenReceiver_1.address, tokenReceiver_2.address, tokenReceiver_3.address, tokenReceiver_4.address];
    let amountArray = [1000, 2000, 2500, 500];
    console.log('amount ERC20 will be sent: ', amountArray);

    let totalSendValue = 0;
    amountArray.forEach((element) => {
      totalSendValue += element;
    });

    multiSenderContract = multiSenderContract.connect(tokenOwner);
    console.log('approve for multiSender contract to send %s ERC20 token...', totalSendValue);

    //aprove to send token
    await erc20Contract.approve(multiSenderContract.address, totalSendValue);

    console.log('ERC20 token balance of receivers BEFORE send:');
    let balanceBeforeArray = [];
    for (let index = 0; index < receiver.length; index++) {
      let blanceBeforeOfReceiver = await await erc20Contract.balanceOf(receiver[index]);
      balanceBeforeArray.push(blanceBeforeOfReceiver);
      console.log('                    + receiver %s: ', index, blanceBeforeOfReceiver);
    }
    //send to multi-address

    await multiSenderContract.sendERC20(erc20Contract.address, receiver, amountArray);

    console.log('ERC20 token balance of receivers AFTER send:');
    for (let index = 0; index < receiver.length; index++) {
      let blanceAfterOfReceiver = await await erc20Contract.balanceOf(receiver[index]);

      console.log('                    + receiver %s: ', index, blanceAfterOfReceiver);
      expect(blanceAfterOfReceiver.sub(balanceBeforeArray[index])).to.equal(BigNumber.from(amountArray[index]));
    }
  });

  it('Send ETH token by multiSender contract', async function () {
    //send by tokenOwner

    multiSenderContract = multiSenderContract.connect(tokenOwner);
    // let receiver = [tokenReceiver_1.address, tokenReceiver_1.address];
    let receiver = [tokenReceiver_1.address, tokenReceiver_2.address, tokenReceiver_3.address, tokenReceiver_4.address];

    let amountArray = [10000, 30000, 25000, 35000];
    //total sent-value
    let totalSendValue = 0;
    amountArray.forEach((element) => {
      totalSendValue += element;
    });

    let balanceOfSenderBefore = await tokenOwner.getBalance();

    let estimateGas = await multiSenderContract.estimateGas.sendEther(receiver, amountArray, {
      value: BigNumber.from(totalSendValue),
    });

    let gasPrice = await multiSenderContract.provider.getGasPrice();
    let gasFee = estimateGas * gasPrice;
    // console.log('estimateGasFee:  ', gasFee);
    let totalSpend = totalSendValue + gasFee;

    if (totalSpend > balanceOfSenderBefore) {
      throw Error('Not enought ETH to send!');
    }

    console.log('ETH(wei) balance of receivers BEFORE send:');
    let balanceBeforeArray = [];
    for (let index = 0; index < RECEIVERS.length; index++) {
      let blanceBeforeOfReceiver = await RECEIVERS[index].getBalance();
      balanceBeforeArray.push(blanceBeforeOfReceiver);
      console.log('                    + receiver %s: ', index, blanceBeforeOfReceiver);
    }

    await multiSenderContract.sendEther(receiver, amountArray, {
      value: BigNumber.from(totalSendValue),
      gasLimit: estimateGas,
    });

    console.log('ETH(wei) balance of receivers AFTER send:');
    for (let index = 0; index < RECEIVERS.length; index++) {
      let blanceAfterOfReceiver = await RECEIVERS[index].getBalance();
      console.log('                    + receiver %s: ', index, blanceAfterOfReceiver);
      //expect increasing value after send have to be equal to sent-value
      expect(blanceAfterOfReceiver.sub(balanceBeforeArray[index])).to.equal(BigNumber.from(amountArray[index]));
    }
  });

  it('approve multisender to transfer NFTs', async function () {
    //change signer to tokenOwner
    erc721Contract = await erc721Contract.connect(tokenOwner);
    //approve transfer
    await erc721Contract.setApprovalForAll(multiSenderContract.address, true);
  });

  it('transfer NFTs by multisender', async function () {
    //send by tokenOwner

    multiSenderContract = multiSenderContract.connect(tokenOwner);
    let receivers = [
      tokenReceiver_1.address,
      tokenReceiver_2.address,
      tokenReceiver_3.address,
      tokenReceiver_4.address,
    ];
    let tokenIds = [1, 3, 50, 79];

    console.log('NFT balance of receivers BEFORE send:');
    let balanceBeforeArray = [];
    for (let index = 0; index < receivers.length; index++) {
      let blanceBeforeOfReceiver = await erc721Contract.balanceOf(receivers[index]);
      balanceBeforeArray.push(blanceBeforeOfReceiver);
      console.log('                    + receiver %s: ', index, blanceBeforeOfReceiver);
    }

    await multiSenderContract.sendERC721(erc721Contract.address, receivers, tokenIds);

    console.log('NFT balance of receivers AFTER send:');
    for (let index = 0; index < receivers.length; index++) {
      let blanceAfterOfReceiver = await erc721Contract.balanceOf(receivers[index]);
      console.log('                    + receiver %s: ', index, blanceAfterOfReceiver);
      expect(await erc721Contract.ownerOf(tokenIds[index])).to.equal(receivers[index]);
    }
  });

  it('remove approved operator', async function () {
    //change signer to tokenOwner
    erc721Contract = await erc721Contract.connect(tokenOwner);
    //approve transfer
    await erc721Contract.setApprovalForAll(multiSenderContract.address, false);
  });

  it('transfer NFT tokenID 10,20,40,69 after removed operater', async function () {
    multiSenderContract = multiSenderContract.connect(tokenOwner);
    let receivers = [
      tokenReceiver_1.address,
      tokenReceiver_2.address,
      tokenReceiver_3.address,
      tokenReceiver_4.address,
    ];
    let tokenIds = [10, 20, 40, 69];

    try {
      await multiSenderContract.sendERC721(erc721Contract.address, receivers, tokenIds);
    } catch (error) {
      console.log('expect fail to transfer!');
    }
  });
});
