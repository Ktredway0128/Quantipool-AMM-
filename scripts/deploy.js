// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory('Token')

  // Deploy Token 1
  let quip = await Token.deploy('Quip Token', 'QP', '1000000') // 1 million tokens
  await quip.deployed()
  console.log(`Quip Token deployed to: ${quip.address}\n`)

  // Deploy Token 2
  const usd = await Token.deploy('USD Token', 'USD', '1000000') // 1 million tokens
  await usd.deployed()
  console.log(`USD Token deployed to: ${usd.address}\n`)

  const QUANTIPOOL = await hre.ethers.getContractFactory('QUANTIPOOL')
  const quantipool = await QUANTIPOOL.deploy(quip.address, usd.address)

  console.log(`QUANTIPOOL contract deployed to: ${quantipool.address}\n`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
