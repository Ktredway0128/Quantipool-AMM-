// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json')
require("dotenv").config()


const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
  }
  
  const ether = tokens
  const shares = ether
  

async function main() {
    
    // Fetch accounts
    console.log(`Fetching accounts & network \n`)

    const { chainId } = await ethers.provider.getNetwork()

    // let deployer, investor1, investor2, investor3, investor4

    if (chainId === 31337) {
      // Hardhat
      const accounts = await ethers.getSigners()
      ;[deployer = accounts[0], 
        investor1 = accounts[1], 
        investor2 = accounts[2], 
        investor3 = accounts[3], 
        investor4 = accounts[4]] = accounts

    } else {
      // Sepolia
      const provider = ethers.provider
      deployer  = new ethers.Wallet(process.env.DEPLOYER_PK, provider)
      investor1 = new ethers.Wallet(process.env.INVESTOR1_PK, provider)
      investor2 = new ethers.Wallet(process.env.INVESTOR2_PK, provider)
      investor3 = new ethers.Wallet(process.env.INVESTOR3_PK, provider)
      investor4 = new ethers.Wallet(process.env.INVESTOR4_PK, provider)
    }

    console.log(`Fetching token and transferring to accounts...\n`)

    // Fetch Quip Token
    const quip = await ethers.getContractAt('Token', config[chainId].quip.address)
    console.log(`Quip Token fetched: ${quip.address}\n`)

    // Fetch USD Token
    const usd = await ethers.getContractAt('Token', config[chainId].usd.address)
    console.log(`USD Token fetched: ${usd.address}\n`)


    // ///////////////////////////////
    // ////// Distribute Tokens to Investors
    // 

    let transaction
    // Send quip tokens to investor 1
    transaction = await quip.connect(deployer).transfer(investor1.address, tokens(10))
    await transaction.wait()

    // Send usd tokens to investor 2
    transaction = await usd.connect(deployer).transfer(investor2.address, tokens(10))
    await transaction.wait()

    // Send quip tokens to investor 3
    transaction = await quip.connect(deployer).transfer(investor3.address, tokens(10))
    await transaction.wait()

    // Send usd tokens to investor 4
    transaction = await usd.connect(deployer).transfer(investor4.address, tokens(10))
    await transaction.wait()


    // ///////////////////////////////////////////
    // Adding Liquidity
    // 

    let amount = tokens(50_000)

    console.log(`Fetching QUAINTPOOL...\n`)

    // Fetch QUANTIPOOL
    const quantipool = await ethers.getContractAt('QUANTIPOOL', config[chainId].quantipool.address)
    console.log(`Quantipool fetched: ${quantipool.address}\n`)

    transaction = await quip.connect(deployer).approve(quantipool.address, amount)
    await transaction.wait()

    transaction = await usd.connect(deployer).approve(quantipool.address, amount)
    await transaction.wait()





    // Deployer adds liquidity
    console.log(`Adding liquidity...\n`)
    transaction = await quantipool.connect(deployer).addLiquidity(amount, amount)
    await transaction.wait()

    // /////////////////////////////////////////////
    // Investor 1 Swaps: Quip --> USD
    // 

    console.log(`Investor 1 Swaps...\n`)

    // Investor approves all tokens
    transaction = await quip.connect(investor1).approve(quantipool.address, tokens(50))
    await transaction.wait()

    // Investor swaps 1 token
    transaction = await quantipool.connect(investor1).swapTokenA(tokens(1))
    await transaction.wait()

    // /////////////////////////////////////////////
    // Investor 2 Swaps: USD --> Quip
    // 

    console.log(`Investor 2 Swaps...\n`)

    // Investor approves all tokens
    transaction = await usd.connect(investor2).approve(quantipool.address, tokens(50))
    await transaction.wait()

    // Investor swaps 1 token
    transaction = await quantipool.connect(investor2).swapTokenB(tokens(1))
    await transaction.wait() 


    // /////////////////////////////////////////////
    // Investor 3 Swaps: Quip --> USD
    // 

    console.log(`Investor 3 Swaps...\n`)

    // Investor approves all tokens
    transaction = await quip.connect(investor3).approve(quantipool.address, tokens(50))
    await transaction.wait()

    // Investor swaps all 10 tokens
    transaction = await quantipool.connect(investor3).swapTokenA(tokens(2))
    await transaction.wait() 

    
    
    // /////////////////////////////////////////////
    // Investor 4 Swaps: USD --> Quip
    // 

    console.log(`Investor 4 Swaps...\n`)

    

    // Investor approves all tokens
    transaction = await usd.connect(investor4).approve(quantipool.address, tokens(50))
    await transaction.wait()

    // Investor swaps 5 tokens
    transaction = await quantipool.connect(investor4).swapTokenB(tokens(0.5))
    await transaction.wait() 

    console.log(`Finished.\n`)

    

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// new accounts, add test sepolia, hardcode the addresses into the file
