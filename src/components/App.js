import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Tabs from './Tabs'
import Swap from './Swap'
import Deposit from './Deposit'
import Withdraw from './Withdraw'
import Charts from './Charts'

import {  
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadQUANTIPOOL
} from '../store/interactions'

function App() {

  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = await loadProvider(dispatch)

    // Fetch current network's chainId
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    // Fetch current account from Metamask when changed
    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch)
    })
   
    // Initiate contracts
    await loadTokens(provider, chainId, dispatch)
    await loadQUANTIPOOL(provider, chainId, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  }, []);

  return(
    <Container>
      <HashRouter>
        
        <Navigation />
        
        <hr />

        <Tabs />
      
        <Routes>
          <Route exact path="/" element={<Swap />} />
          <Route exact path="deposit" element={<Deposit />} />
          <Route exact path="withdraw" element={<Withdraw />} />
          <Route exact path="charts" element={<Charts />} />
        </Routes>
      
      </HashRouter>
    </Container>
  )
}

export default App;
