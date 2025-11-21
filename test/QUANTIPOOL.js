const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('QUANTIPOOL', () => {
  let  accounts, deployer, token1, token2, quantipool

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('QUIP', 'QP', '1000000') // 1 Million Tokens
    token2 = await Token.deploy('USD Token', 'USD', '1000000') // 1 Million Tokens

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

})
