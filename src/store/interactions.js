import { ethers } from 'ethers'

import {     
    setProvider, 
    setNetwork,
    setAccount
} from './reducers/provider'

import {     
    setContracts,
    setSymbols,
    balancesLoaded
} from './reducers/tokens'

import {     
    setContract,
    sharesLoaded,
    swapsLoaded,
    depositRequest,
    depositSuccess,
    depositFail,
    withdrawRequest,
    withdrawSuccess,
    withdrawFail,   
    swapRequest,
    swapSuccess,
    swapFail,
} from './reducers/quantipool'

import TOKEN_ABI from '../abis/Token.json';
import QUANTIPOOL_ABI from '../abis/QUANTIPOOL.json';
import config from '../config.json';

export const loadProvider = (dispatch) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    dispatch(setProvider(provider))

    return provider
}

export const loadNetwork = async (provider, dispatch) => {
    const { chainId } = await provider.getNetwork()
    dispatch(setNetwork(chainId))

    return chainId
}


export const loadAccount = async (dispatch) => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    dispatch(setAccount(account))

    return account 
}

// ----------------------------------------------
// LOAD CONTRACTS
export const loadTokens = async (provider, chainId, dispatch) => {
    const quip = new ethers.Contract(config[chainId].quip.address, TOKEN_ABI, provider)
    const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider)
  
    dispatch(setContracts([quip, usd]))
    dispatch(setSymbols([await quip.symbol(), await usd.symbol()]))
  }

export const loadQUANTIPOOL = async (provider, chainId, dispatch) => {
    const quantipool = new ethers.Contract(config[chainId].quantipool.address, QUANTIPOOL_ABI, provider)

    dispatch(setContract(quantipool))

    return quantipool
}

//------------------------------------------------
// LOAD BALANCES & SHARES

export const loadBalances = async (quantipool, tokens, account, dispatch) => {
    const balance1 = await tokens[0].balanceOf(account)
    const balance2 = await tokens[1].balanceOf(account)

    dispatch(balancesLoaded([
        ethers.utils.formatUnits(balance1.toString(), 'ether'),
        ethers.utils.formatUnits(balance2.toString(), 'ether')
    ]))

    const shares = await quantipool.shares(account)
    dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), 'ether')))
}

//------------------------------------------------
// ADD LIQUIDITY
export const addLiquidity = async(provider, quantipool, tokens, amounts, dispatch) => {
    try {
        dispatch(depositRequest())

        const signer = await provider.getSigner()
    
        let transaction
        
        transaction = await tokens[0].connect(signer).approve(quantipool.address, amounts[0])
        await transaction.wait()

        transaction = await tokens[1].connect(signer).approve(quantipool.address, amounts[1])
        await transaction.wait()

        transaction = await quantipool.connect(signer).addLiquidity(amounts[0], amounts[1])
        await transaction.wait

        dispatch(depositSuccess(transaction.hash))
    } catch (error) {
        dispatch(depositFail())
    }


}

//------------------------------------------------
// REMOVE LIQUIDITY
export const removeLiquidity = async (provider, quantipool, shares, dispatch) => {
    try {
        dispatch(withdrawRequest())

        const signer = await provider.getSigner()

        let transaction = await quantipool.connect(signer).removeLiquidity(shares)
        await transaction.wait

        dispatch(withdrawSuccess(transaction.hash))
    } catch (error) {
        dispatch(withdrawFail())
    }

}
  










//------------------------------------------------
// SWAP

export const swap = async (provider, quantipool, token, symbol, amount, dispatch) => {
    try {
    
        dispatch(swapRequest())

        let transaction
    
        const signer = await provider.getSigner()
    
        transaction = await token.connect(signer).approve(quantipool.address, amount)
        await transaction.wait()
    
        if (symbol === "QP") {
            transaction = await quantipool.connect(signer).swapTokenA(amount)
        } else {
            transaction = await quantipool.connect(signer).swapTokenB(amount)
        }
    
        await transaction.wait()
    
        dispatch(swapSuccess(transaction.hash))

    } catch (error) {
        dispatch(swapFail())
    }
}

//------------------------------------------------
// LOAD ALL SWAPS

export const loadAllSwaps = async (provider, quantipool, dispatch) => {

    // Fetch swaps from Blockchain
    const block = await provider.getBlockNumber()
    
    const swapStream = await quantipool.queryFilter('Swap', 0, block)
    const swaps = swapStream.map(event => {
        return { hash: event.transactionHash, args: event.args }
    })

    dispatch(swapsLoaded(swaps))

}
    






