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

  before(async function () {
    const signers = await ethers.getSigners();

    tokenOwner = signers[0];

    tokenReceiver_1 = signers[1];

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

    //get and deploy multiSender contract
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
    console.log('minting NFT');
    for (let index = 0; index < 100; index++) {
      await erc721Contract.mint(tokenOwner.address, index, 'Qmb6tWBDLd9j2oSnvSNhE314WFL7SRpQNtfwjFWsStXp5A');
    }
    let balance = await erc721Contract.balanceOf(tokenOwner.address);
    console.log("tokenOwner's NFT balance: ", balance);
    // let uri = await erc721Contract.tokenURI(index);
    // console.log('uri: ', uri);
  });

  it('approve for transfer', async function () {
    //change signer to tokenOwner
    erc20Contract = await erc20Contract.connect(tokenOwner);
    //approve transfer
    await erc20Contract.approve(multiSenderContract.address, 5555);
  });

  it('test get balance by contract', async function () {
    //send by tokenOwner
    console.log('balance of receiver:');
    multiSenderContract = multiSenderContract.connect(tokenOwner);
    let receiver = [tokenReceiver_1.address, tokenReceiver_1.address];
    let amountArray = [1111, 2231];
    await multiSenderContract.sendERC20(erc20Contract.address, receiver, amountArray);
    let finalBalance = await erc20Contract.balanceOf(tokenReceiver_1.address);
    console.log('finalBalance', finalBalance);
  });

  it('test send ether', async function () {
    //send by tokenOwner

    multiSenderContract = multiSenderContract.connect(tokenOwner);
    let receiver = [tokenReceiver_1.address, tokenReceiver_1.address];
    let balanceBefore = await tokenOwner.getBalance();
    let balanceReceiverBefore = await tokenReceiver_1.getBalance();
    console.log('>>>>> balance of tokenowner before send: ', balanceBefore);
    let amountArray = [10000, 10000];
    let gas = await multiSenderContract.estimateGas.sendEther(receiver, amountArray, { value: BigNumber.from(30000) });
    let gasPrice = await multiSenderContract.provider.getGasPrice();
    let gasFee = gas * gasPrice;
    console.log('estimateGasFee:  ', gasFee);
    await multiSenderContract.sendEther(receiver, amountArray, { value: BigNumber.from(30000), gasLimit: gas });
    let balanceAfter = await tokenOwner.getBalance();
    let balanceReceiverAfter = await tokenReceiver_1.getBalance();
    let receiverIncrease = balanceReceiverAfter.sub(balanceReceiverBefore);
    console.log('>>>>> balance of tokenowner after send: ', balanceAfter);

    let spendWie = balanceBefore.sub(balanceAfter);

    console.log('>>>>> spent: ', spendWie);
    console.log('receiverIncrease: ', receiverIncrease);
  });

  it('approve for transfer NFT', async function () {
    //change signer to tokenOwner
    erc721Contract = await erc721Contract.connect(tokenOwner);
    //approve transfer
    await erc721Contract.setApprovalForAll(multiSenderContract.address, true);
  });

  it('transfer NFT', async function () {
    //send by tokenOwner
    console.log('balance of receiver:');
    multiSenderContract = multiSenderContract.connect(tokenOwner);
    let receivers = [tokenReceiver_1.address, tokenReceiver_1.address];
    let tokenIds = [1, 3];
    await multiSenderContract.sendERC721(erc721Contract.address, receivers, tokenIds);
    let finalBalance = await erc721Contract.balanceOf(tokenReceiver_1.address);
    console.log('finalBalance', finalBalance);
  });

  it('remove operator', async function () {
    //change signer to tokenOwner
    erc721Contract = await erc721Contract.connect(tokenOwner);
    //approve transfer
    await erc721Contract.setApprovalForAll(multiSenderContract.address, false);
  });

  it('transfer NFT 1,3 after remove operater', async function () {
    //send by tokenOwner
    console.log('balance of receiver:');
    multiSenderContract = multiSenderContract.connect(tokenOwner);
    let receivers = [tokenReceiver_1.address, tokenReceiver_1.address];
    let tokenIds = [1, 3];
    try {
      await multiSenderContract.sendERC721(erc721Contract.address, receivers, tokenIds);
    } catch (error) {}
  });
});
