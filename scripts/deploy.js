const { ethers } = require('hardhat');

async function main() {
  const erc20Contract = await ethers.getContractFactory('ERC20Mintable');
  const ercDeploy = await erc20Contract.deploy();

  const con = await ercDeploy.deployed();

  console.log('Success! Contract was deployed to: ', con.address);
  console.log('hello');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
