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
    token1 = await Token.deploy('QUIP', 'QP', '1000000') // 1 Million Tokens
    token2 = await Token.deploy('USD Token', 'USD', '1000000') // 1 Million Tokens

    // Send tokens to liquidityProvider
    let transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000))
    await transaction.wait()

    // Send token1 to investor1
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    // Send token2 to investor2
    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()
    
    // Deploy QUANTIPOOL(AMM)
    const QUANTIPOOL = await ethers.getContractFactory('QUANTIPOOL')
    quantipool = await QUANTIPOOL.deploy(token1.address, token2.address)


  })

    describe('Deployment', () => {
    

        it('has an address', async () => {
        expect(quantipool.address).to.not.equal(0x0)
        })

        it('tracks token1 address', async () => {
            expect(await quantipool.token1()).to.equal(token1.address)
        })

        it('tracks token2 address', async () => {
            expect(await quantipool.token2()).to.equal(token2.address)
        })
    
    })

    describe('Swapping tokens', () => {
        let amount, transaction, result, estimate, balance
    
        it('facilitates swaps', async () => {
            // Deployer approves 100k tokens
            amount = tokens(100000) 
            transaction = await token1.connect(deployer).approve(quantipool.address, amount)
            await transaction.wait()

            transaction = await token2.connect(deployer).approve(quantipool.address, amount)
            await transaction.wait()

            // Deployer adds liquidity
            transaction = await quantipool.connect(deployer).addLiquidity(amount, amount)
            await transaction.wait()

            // Check that QUANTIPOOL(AMM) receives tokens
            expect(await token1.balanceOf(quantipool.address)).to.equal(amount)
            expect(await token2.balanceOf(quantipool.address)).to.equal(amount)

            expect(await quantipool.token1Balance()).to.equal(amount)
            expect(await quantipool.token2Balance()).to.equal(amount)

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
            transaction = await token1.connect(liquidityProvider).approve(quantipool.address, amount)
            await transaction.wait()

            transaction = await token2.connect(liquidityProvider).approve(quantipool.address, amount)
            await transaction.wait()

            // Calculate token2 deposit amount
            let token2Deposit = await quantipool.calculateToken2Deposit(amount)

            // // LP adds liquidity
            transaction = await quantipool.connect(liquidityProvider).addLiquidity(amount, token2Deposit)
            await transaction.wait()
            
            // LP should have 50 shares
            expect(await quantipool.shares(liquidityProvider.address)).to.equal(tokens(50)) // Used token helper to calculate shares

            // Deployer should have 100 shares
            expect(await quantipool.shares(deployer.address)).to.equal(tokens(100))

            // Pool should be 150 shares
            expect(await quantipool.totalShares()).to.equal(tokens(150))

            
            // ////////////////////////////////////////////////////
            // Investor1 swaps
            // 

            // Check price before swapping
            console.log(`Price: ${await quantipool.token2Balance() / await quantipool.token1Balance()} \n`)
            

            // Investor1 approves all tokens
            transaction = await token1.connect(investor1).approve(quantipool.address, tokens(100000))
            await transaction.wait()

            // Check investor1 balance before swap
            // expect(await token2.balanceOf(investor1.address)).to.equal(0)
            balance = await token2.balanceOf(investor1.address)
            console.log(`Investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)

            // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
            estimate = await quantipool.calculateToken1Swap(tokens(1))
            console.log(`Estimate of token2 that investor1 will receive, including slippage: ${ethers.utils.formatEther(estimate)}\n`)

            // Investor1 swaps 1 token1
            transaction = await quantipool.connect(investor1).swapToken1(tokens(1))
            result = await transaction.wait()

            // Check swap event
            await expect(transaction).to.emit(quantipool, 'Swap')
                .withArgs(
                    investor1.address,
                    token1.address,
                    tokens(1),
                    token2.address,
                    estimate,
                    await quantipool.token1Balance(),
                    await quantipool.token2Balance(),
                    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                )

            // Check investor1 balance after swap
            // expect(await token2.balanceOf(investor1.address)).to.equal(estimate)
            balance = await token2.balanceOf(investor1.address)
            console.log(`Investor1 balance of token2 after swap: ${ethers.utils.formatEther(balance)}\n`)
            expect(estimate).to.equal(balance)

            // Check QUANTIPOOL token balance are in sync
            expect(await token1.balanceOf(quantipool.address)).to.equal(await quantipool.token1Balance())
            expect(await token2.balanceOf(quantipool.address)).to.equal(await quantipool.token2Balance())

            // Check price after swapping
            console.log(`Price: ${await quantipool.token2Balance() / await quantipool.token1Balance()} \n`)

            // ////////////////////////////////////////////////////
            // Investor1 swaps again
            // 

            // Swap some more tokens to see what happens

            balance = await token2.balanceOf(investor1.address)
            console.log(`Investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

            // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
            estimate = await quantipool.calculateToken1Swap(tokens(1))
            console.log(`Estimate of token2 that investor1 will receive, including slippage: ${ethers.utils.formatEther(estimate)}`)

            // Swap 1 more token
            transaction = await quantipool.connect(investor1).swapToken1(tokens(1))
            await transaction.wait()

            // Check investor1 balance after swap
            balance = await token2.balanceOf(investor1.address)
            console.log(`Investor1 balance of token2 after swap: ${ethers.utils.formatEther(balance)}\n`)

            // Checking the balances are still in sync
            expect(await token1.balanceOf(quantipool.address)).to.equal(await quantipool.token1Balance())
            expect(await token2.balanceOf(quantipool.address)).to.equal(await quantipool.token2Balance())

            // Check price after swap

            console.log(`Price: ${await quantipool.token2Balance() / await quantipool.token1Balance()} \n `)


            // ////////////////////////////////////////////////////
            // Investor1 swaps a large amount
            // 

            // Check investor balance before swap
            balance = await token2.balanceOf(investor1.address)
            console.log(`Investor1 token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

            // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
            estimate = await quantipool.calculateToken1Swap(tokens(100))
            console.log(`Estimate of token2 that investor1 will receive, including slippage: ${ethers.utils.formatEther(estimate)}`)

            // Swap 1 more token
            transaction = await quantipool.connect(investor1).swapToken1(tokens(100))
            await transaction.wait()

            // Check investor1 balance after swap
            balance = await token2.balanceOf(investor1.address)
            console.log(`Investor1 balance of token2 after swap: ${ethers.utils.formatEther(balance)}\n`)

            // Checking the balances are still in sync
            expect(await token1.balanceOf(quantipool.address)).to.equal(await quantipool.token1Balance())
            expect(await token2.balanceOf(quantipool.address)).to.equal(await quantipool.token2Balance())

            // Check price after swap

            console.log(`Price: ${await quantipool.token2Balance() / await quantipool.token1Balance()} \n `)


            // ////////////////////////////////////////////////////
            // Investor2 swaps token2 for token1
            // 

            // Investor2 approves all tokens
            transaction = await token2.connect(investor2).approve(quantipool.address, tokens(100000))
            await transaction.wait()
            
            // Check investor2 balance before swap
            balance = await token1.balanceOf(investor2.address)
            console.log(`Investor2 token1 balance before swap: ${ethers.utils.formatEther(balance)}`)

            // Estimate amount of tokens investor2 will receive after swapping token2: include slippage
            estimate = await quantipool.calculateToken2Swap(tokens(1))
            console.log(`Token1 amount investor2 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

            // Investor2 swaps 1 token
            transaction = await quantipool.connect(investor2).swapToken2(tokens(1))
            await transaction.wait()

            // Check swap event
            await expect(transaction).to.emit(quantipool, 'Swap')
                .withArgs(
                    investor2.address,
                    token2.address,
                    tokens(1),
                    token1.address,
                    estimate,
                    await quantipool.token2Balance(),
                    await quantipool.token1Balance(),
                    (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
                    )

            // // Check investor2 balance after swap
            balance = await token1.balanceOf(investor2.address)
            console.log(`Investor2 token1 balance after swap: ${ethers.utils.formatEther(balance)}`)
            expect(estimate).to.equal(balance)
            

            // Checking the balances are still in sync
            expect(await token1.balanceOf(quantipool.address)).to.equal(await quantipool.token1Balance())
            expect(await token2.balanceOf(quantipool.address)).to.equal(await quantipool.token2Balance())

            // Check price after swap
            console.log(`Price: ${await quantipool.token2Balance() / await quantipool.token1Balance()} \n `)

        
                    // ////////////////////////////////////////////////////
            // Removing Liquidity
            // 

            console.log(`QUANTIPOOL Token1 Balance: ${ethers.utils.formatEther(await quantipool.token1Balance())} \n`)
            console.log(`QUANTIPOOL Token2 Balance: ${ethers.utils.formatEther(await quantipool.token2Balance())} \n`)

            // Check Liquidity Provider shares before removing liquidity
            balance = await token1.balanceOf(liquidityProvider.address)
            console.log(`LP token1 balance before removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            balance = await token2.balanceOf(liquidityProvider.address)
            console.log(`LP token2 balance before removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            // LP removes tokens

            transaction = await quantipool.connect(liquidityProvider).removeLiquidity(shares(50)) 
            await transaction.wait()

            
            // Balance after removing liquidity
            balance = await token1.balanceOf(liquidityProvider.address)
            console.log(`LP token1 amount after removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            balance = await token2.balanceOf(liquidityProvider.address)
            console.log(`LP token2 amount after removing liquidity: ${ethers.utils.formatEther(balance)} \n`)

            // LP should have 0 shares
            expect(await quantipool.shares(liquidityProvider.address)).to.equal(0)

            // Deployer should have 100 shares
            expect(await quantipool.shares(deployer.address)).to.equal(shares(100))

            // QUANTIPOOL Pool has 100 total shares
            expect(await quantipool.totalShares()).to.equal(shares(100))
            
        
        })       
    })
})
