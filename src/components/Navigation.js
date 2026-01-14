import { useSelector, useDispatch } from 'react-redux'
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Blockies from 'react-blockies'

import logo from '../logo.png';

import { loadAccount, loadBalances } from '../store/interactions'

import config from '../config.json'


import { useState } from 'react';



const Navigation = () => {
  const chainId= useSelector(state => state.provider.chainId)
  const account = useSelector(state => state.provider.account)
  const tokens = useSelector(state => state.tokens.contracts)
  const quantipool = useSelector(state => state.quantipool.contract)

  const [selectedNetwork, setSelectedNetwork] = useState("0");

  const dispatch = useDispatch()

  const connectHandler = async () => {
    const account = await loadAccount(dispatch)
    await loadBalances(quantipool, tokens, account, dispatch)
  }

  const networkHandler = async (e) => {
    const value = e.target.value;
    setSelectedNetwork(value);

    if (value === "0") return;

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: value }],
    })
  }
  
  return (
    <Navbar move-logo className='my-3' expand="lg">
      <img
        alt="logo"
        src={logo}
        width="80"
        height="80"
        className="d-inline-block align-top mx-3 "
      />
      <Navbar.Brand href="#" className="">QuantiPool</Navbar.Brand>
      <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav" className="justify-content-end">
        
        <div className="d-flex justify-content-end mt-3">

        
        {account && (
          <Form.Select
          aria-label="Network Selector"
          value={selectedNetwork}
          onChange={networkHandler}
          style={{ maxWidth: '200px', marginRight: '20px' }}
        >
          <option value="0" disabled>Select Network</option>
          <option value="0x7A69">Localhost</option>
          <option value="0xAA36A7">Sepolia</option>
        </Form.Select>
        )}
        
          
      
          
          {account ? (
            <Navbar.Text className='d-flex align-items-center'>
              {account.slice(0, 5) + '...' + account.slice(38, 42)}
              <Blockies 
                seed={account}
                size={10}
                scale={3}
                color="#1F3B61"
                bgColor="#F1F2F9"
                spotColor="#767F92"
                className="identicon mx-2"
              />
            </Navbar.Text>
          ) : (
            <Button 
              onClick={connectHandler} 
              className="submit-buttons connect-circle"
            >
              Connect
            </Button>
          )}

        </div>
          
      </Navbar.Collapse>
    </Navbar>
  );
}

export default Navigation;
