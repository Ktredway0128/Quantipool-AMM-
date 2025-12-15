const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

describe('QUANTIPOOL', () => {
    let accounts, 
        deployer, 
        liquidityProvider,
        investor1,
        investor2
        
    let token1, 
        token2, 
        quantipool

  beforeEach(async () => {
    // Set up accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    liquidityProvider = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]
    
    // Deploy Token
    const Token = await ethers.getContractFactory('Token')
    tokenA = await Token.deploy('QUIP', 'QP', '1000000') // 1 Million Tokens
    tokenB = await Token.deploy('USD Token', 'USD', '1000000') // 1 Million Tokens

    // Send tokens to liquidityProvider
    let transaction = await tokenA.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    transaction = await tokenB.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // Send token1 to investor1
    transaction = await tokenA.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    // Send token2 to investor2
    transaction = await tokenB.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()
    
    // Deploy QUANTIPOOL(AMM)
    const QUANTIPOOL = await ethers.getContractFactory('QUANTIPOOL')
    quantipool = await QUANTIPOOL.deploy(tokenA.address, tokenB.address)


  })

    describe('Deployment', () => {
    

        it('has an address', async () => {
        expect(quantipool.address).to.not.equal(0x0)
        })

        it('tracks tokenA address', async () => {
            expect(await quantipool.tokenA()).to.equal(tokenA.address)
        })

        it('tracks tokenB address', async () => {
            expect(await quantipool.tokenB()).to.equal(tokenB.address)
        })
    
    })

    describe('Swapping tokens', () => {
        let amount, transaction, result, estimate, balance
    
        it('facilitates swaps', async () => {
            // Deployer approves 100k tokens
            amount = tokens(100000) 
            transaction = await tokenA.connect(deployer).approve(quantipool.address, amount)
            await transaction.wait()

            transaction = await tokenB.connect(deployer).approve(quantipool.address, amount)
            await transaction.wait()

            // Deployer adds liquidity
            transaction = await quantipool.connect(deployer).addLiquidity(amount, amount)
            await transaction.wait()

            // Check that QUANTIPOOL(AMM) receives tokens
            expect(await tokenA.balanceOf(quantipool.address)).to.equal(amount)
            expect(await tokenB.balanceOf(quantipool.address)).to.equal(amount)

            expect(await quantipool.tokenABalance()).to.equal(amount)
            expect(await quantipool.tokenBBalance()).to.equal(amount)

            // Check deployer has 100 shares
            expect(await quantipool.shares(deployer.address)).to.equal(tokens(100)) // Used tokens helper to calculate the shares
        
            // Check pool has 100 total shares
            expect(await quantipool.totalShares()).to.equal(tokens(100))       
        
            
            // ////////////////////////////////////////////////////
            // LP adds more liquidity
            // 

            // LP approves 50k tokens
            amount = tokens(50000)
            depositToken1 = tokens(0)
            transaction = await tokenA.connect(liquidityProvider).approve(quantipool.address, amount)
            await transaction.wait()

            transaction = await tokenB.connect(liquidityProvider).approve(quantipool.address, amount)
            await transaction.wait()

            // Calculate token2 deposit amount
            let tokenBDeposit = await quantipool.evaluateTokenBDeposit(amount)

            // // LP adds liquidity
            transaction = await quantipool.connect(liquidityProvider).addLiquidity(amount, tokenBDeposit)
            await transaction.wait()
            
            // LP should have 50 shares
            expect(await quantipool.shares(liquidityProvider.address)).to.equal(tokens(50)) // Used token helper to calculate shares

            // Deployer should have 100 shares
            expect(await quantipool.shares(deployer.address)).to.equal(tokens(100))

            // Pool should be 150 shares
            expect(await quantipool.totalShares()).to.equal(tokens(150))

            
            // // ////////////////////////////////////////////////////
            // // Investor1 swaps
            // // 

            // Check price before swapping
            console.log(`Price: ${await quantipool.tokenBBalance() / await quantipool.tokenABalance()} \n`)
            

            // Investor1 approves all tokens
            transaction = await tokenA.connect(investor1).approve(quantipool.address, tokens(100000))
            await transaction.wait()

            // Check investor1 balance before swap
            balance = await tokenB.balanceOf(investor1.address)
            console.log(`Investor1 tokenB balance before swap: ${ethers.utils.formatEther(balance)}\n`)

            // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
            estimate = await quantipool.evaluateTokenASwap(tokens(1))
            console.log(`Estimate of tokenB that investor1 will receive, including slippage: ${ethers.utils.formatEther(estimate)}\n`)

            // Investor1 swaps 1 token1
            transaction = await quantipool.connect(investor1).swapTokenA(tokens(1))
            result = await transaction.wait()

            // Check swap event
            await expect(transaction).to.emit(quantipool, 'Swap')
                .withArgs(
                    investor1.address,
                    tokenA.address,
                    tokens(1),
                    tokenB.address,
                    estimate,
                    await quantipool.tokenABalance(),
                    await quantipool.tokenBBalance(),
                    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                )

            // Check investor1 balance after swap
            // expect(await token2.balanceOf(investor1.address)).to.equal(estimate)
            balance = await tokenB.balanceOf(investor1.address)
            console.log(`Investor1 balance of tokenB after swap: ${ethers.utils.formatEther(balance)}\n`)
            expect(estimate).to.equal(balance)

            // Check QUANTIPOOL token balance are in sync
            expect(await tokenA.balanceOf(quantipool.address)).to.equal(await quantipool.tokenABalance())
            expect(await tokenB.balanceOf(quantipool.address)).to.equal(await quantipool.tokenBBalance())

            // Check price after swapping
            console.log(`Price: ${await quantipool.tokenBBalance() / await quantipool.tokenABalance()} \n`)

            // // ////////////////////////////////////////////////////
            // // Investor1 swaps again
            // // 

            // // Swap some more tokens to see what happens

            // balance = await token2.balanceOf(investor1.address)
            // console.log(`Investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

            // Estimate amount of tokens investor1 will receive after swapping tokenA: include slippage
            estimate = await quantipool.evaluateTokenASwap(tokens(1))
            console.log(`Estimate of tokenB that investor1 will receive, including slippage: ${ethers.utils.formatEther(estimate)}`)

            // Swap 1 more token
            transaction = await quantipool.connect(investor1).swapTokenA(tokens(1))
            await transaction.wait()

            // Check investor1 balance after swap
            balance = await tokenB.balanceOf(investor1.address)
            console.log(`Investor1 balance of tokenB after swap: ${ethers.utils.formatEther(balance)}\n`)

            // Checking the balances are still in sync
            expect(await tokenA.balanceOf(quantipool.address)).to.equal(await quantipool.tokenABalance())
            expect(await tokenB.balanceOf(quantipool.address)).to.equal(await quantipool.tokenBBalance())

            // Check price after swap

            console.log(`Price: ${await quantipool.tokenBBalance() / await quantipool.tokenABalance()} \n `)


            // // ////////////////////////////////////////////////////
            // // Investor1 swaps a large amount
            // // 

            // Check investor balance before swap
            balance = await tokenB.balanceOf(investor1.address)
            console.log(`Investor1 tokenB balance before swap: ${ethers.utils.formatEther(balance)}`)

            // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
            estimate = await quantipool.evaluateTokenASwap(tokens(100))
            console.log(`Estimate of tokenB that investor1 will receive, including slippage: ${ethers.utils.formatEther(estimate)}`)

            // Swap 1 more token
            transaction = await quantipool.connect(investor1).swapTokenA(tokens(100))
            await transaction.wait()

            // Check investor1 balance after swap
            balance = await tokenB.balanceOf(investor1.address)
            console.log(`Investor1 balance of tokenB after swap: ${ethers.utils.formatEther(balance)}\n`)

            // Checking the balances are still in sync
            expect(await tokenA.balanceOf(quantipool.address)).to.equal(await quantipool.tokenABalance())
            expect(await tokenB.balanceOf(quantipool.address)).to.equal(await quantipool.tokenBBalance())

            // Check price after swap

            console.log(`Price: ${await quantipool.tokenBBalance() / await quantipool.tokenABalance()} \n `)


            // // ////////////////////////////////////////////////////
            // // Investor2 swaps token2 for token1
            // // 

            // Investor2 approves all tokens
            transaction = await tokenB.connect(investor2).approve(quantipool.address, tokens(100000))
            await transaction.wait()
            
            // Check investor2 balance before swap
            balance = await tokenA.balanceOf(investor2.address)
            console.log(`Investor2 tokenA balance before swap: ${ethers.utils.formatEther(balance)}`)

            // Estimate amount of tokens investor2 will receive after swapping token2: include slippage
            estimate = await quantipool.evaluateTokenBSwap(tokens(1))
            console.log(`TokenA amount investor2 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

            // Investor2 swaps 1 token
            transaction = await quantipool.connect(investor2).swapTokenB(tokens(1))
            await transaction.wait()

            // Check swap event
            await expect(transaction).to.emit(quantipool, 'Swap')
                .withArgs(
                    investor2.address,
                    tokenB.address,
                    tokens(1),
                    tokenA.address,
                    estimate,
                    await quantipool.tokenBBalance(),
                    await quantipool.tokenABalance(),
                    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                    )

            // // Check investor2 balance after swap
            balance = await tokenA.balanceOf(investor2.address)
            console.log(`Investor2 tokenA balance after swap: ${ethers.utils.formatEther(balance)}`)
            expect(estimate).to.equal(balance)
            

            // Checking the balances are still in sync
            expect(await tokenA.balanceOf(quantipool.address)).to.equal(await quantipool.tokenABalance())
            expect(await tokenB.balanceOf(quantipool.address)).to.equal(await quantipool.tokenBBalance())

            // Check price after swap
            console.log(`Price: ${await quantipool.tokenBBalance() / await quantipool.tokenABalance()} \n `)

        
            //         // ////////////////////////////////////////////////////
            // // Removing Liquidity
            // // 

            console.log(`QUANTIPOOL TokenA Balance: ${ethers.utils.formatEther(await quantipool.tokenABalance())} \n`)
            console.log(`QUANTIPOOL TokenB Balance: ${ethers.utils.formatEther(await quantipool.tokenBBalance())} \n`)

            // Check Liquidity Provider shares before removing liquidity
            balance = await tokenA.balanceOf(liquidityProvider.address)
            console.log(`LP tokenA balance before removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            balance = await tokenB.balanceOf(liquidityProvider.address)
            console.log(`LP tokenB balance before removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            // LP removes tokens

            transaction = await quantipool.connect(liquidityProvider).removeLiquidity(shares(50)) 
            await transaction.wait()

            
            // Balance after removing liquidity
            balance = await tokenA.balanceOf(liquidityProvider.address)
            console.log(`LP tokenA amount after removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            balance = await tokenB.balanceOf(liquidityProvider.address)
            console.log(`LP tokenB amount after removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            // LP should have 0 shares
            expect(await quantipool.shares(liquidityProvider.address)).to.equal(0)

            // Deployer should have 100 shares
            expect(await quantipool.shares(deployer.address)).to.equal(shares(100))

            // QUANTIPOOL Pool has 100 total shares
            expect(await quantipool.totalShares()).to.equal(shares(100))
            
        
        })       
    })
})
