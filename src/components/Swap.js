import { ethers } from 'ethers';
import { useState, useEffect } from'react';
import { useSelector, useDispatch } from 'react-redux';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'
import Row from 'react-bootstrap/Row';

import Alert from './Alert'

import './App.css'

import { 
    swap, 
    loadBalances
} from '../store/interactions'

const Trade = () => {
    const [inputToken, setInputToken] = useState(null)
    const [outputToken, setOutputToken] = useState(null)
    const [inputAmount, setInputAmount] = useState(0)
    const [outputAmount, setOutputAmount] = useState(0)
    
    const [price, setPrice] = useState(0)

    const [showAlert, setShowAlert] = useState(false)
    
    const provider = useSelector(state=> state.provider.connection)
    const account = useSelector(state => state.provider.account)

    const tokens = useSelector(state => state.tokens.contracts)
    const symbols = useSelector(state => state.tokens.symbols)
    const balances = useSelector(state => state.tokens.balances)

    const quantipool = useSelector(state => state.quantipool.contract)
    const isSwapping = useSelector(state => state.quantipool.swapping.isSwapping)
    const isSuccess = useSelector(state => state.quantipool.swapping.isSuccess)
    const transactionHash = useSelector(state => state.quantipool.swapping.transactionHash)


    const dispatch = useDispatch()

    const inputHandler = async (e) => {
        if (!inputToken || !outputToken) {
            window.alert('Please select token')
            return
        }

        if (inputToken === outputToken) {
            window.alert('Invalid token options')
            return
        }

        if (inputToken === 'QP') {
            setInputAmount(e.target.value)

            const _tokenAAmount = ethers.utils.parseUnits(e.target.value, 'ether')
            const result = await quantipool.evaluateTokenASwap(_tokenAAmount)
            const _tokenBAmount = ethers.utils.formatUnits(result.toString(), 'ether')

            setOutputAmount(_tokenBAmount.toString())

        } else {
            setInputAmount(e.target.value)

            const _tokenBAmount = ethers.utils.parseUnits(e.target.value, 'ether')
            const result = await quantipool.evaluateTokenBSwap(_tokenBAmount)
            const _tokenAAmount = ethers.utils.formatUnits(result.toString(), 'ether')

            setOutputAmount(_tokenAAmount.toString())
        }
    }

    const swapHandler = async (e) => {
        e.preventDefault()

        setShowAlert(false)

        if (inputToken === outputToken) {
            window.alert("Invalid token swap")
            return
        }

        const _inputAmount = ethers.utils.parseUnits(inputAmount, 'ether')

        // Swap token depending on which specific token we are swapping

        if (inputToken === "QP") {
            await swap(provider, quantipool, tokens[0], inputToken, _inputAmount, dispatch)
        } else {
            await swap(provider, quantipool, tokens[1], inputToken, _inputAmount, dispatch)
        }

        await loadBalances(quantipool, tokens, account, dispatch)
        await getPrice()

        setShowAlert(true)

    }

    const getPrice = async () => {
        if (inputToken === outputToken) {
            setPrice(0)
            return
        }

        if (inputToken === 'QP') {
            setPrice(await quantipool.tokenBBalance() / await quantipool.tokenABalance())
        } else {
            setPrice(await quantipool.tokenABalance() / await quantipool.tokenBBalance())
        }
    }

    useEffect(() => {
        if(inputToken && outputToken) {
            getPrice()
        }
      }, [inputToken, outputToken]);

    return (
        
        <div>
            <div>
                <Card 
                    className="glass-card circle-card mx-auto d-flex align-items-center justify-content-center"
                    >
                    {account ? (
                        <div className="circle-content w-100">
                            <Form onSubmit={swapHandler}>
                                
                                <Row className='my-3'>
                                    <div className='d-flex justify-content-between'>
                                        <Form.Label className="ms-2"><strong>Give:</strong></Form.Label>
                                        <Form.Text muted className="me-2">
                                        Balance: {
                                            inputToken === symbols[0] 
                                                ? balances[0].toString().slice(0, 10) 
                                                : inputToken === symbols[1] 
                                                    ? balances[1].toString().slice(0, 10) 
                                                    : 0
                                        }
                                        </Form.Text>
                                    </div>
                                    
                                    <Form.Control
                                        type="number"
                                        placeholder="0.0"
                                        min="0.0"
                                        step="any"
                                        onChange={inputHandler}
                                        disabled={!inputToken}
                                        />

                                        <Dropdown className="mt-2">
                                        <Dropdown.Toggle
                                            variant="outline-secondary"
                                            className="w-100"
                                        >
                                            {inputToken ? inputToken : "Select Token"}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="w-100">
                                            <Dropdown.Item onClick={() => setInputToken("QP")}>QP</Dropdown.Item>
                                            <Dropdown.Item onClick={() => setInputToken("USD")}>USD</Dropdown.Item>
                                        </Dropdown.Menu>
                                        </Dropdown>
                                    
                                </Row>

                                <Row className='my-4'>
                                    <div className='d-flex justify-content-between'>
                                        <Form.Label className="ms-2"><strong>Receive:</strong></Form.Label>
                                        <Form.Text muted className="me-2">
                                        Balance: {
                                            outputToken === symbols[0] 
                                                ? balances[0].toString().slice(0, 10) 
                                                : outputToken === symbols[1] 
                                                    ? balances[1].toString().slice(0, 10) 
                                                    : 0
                                        }
                                        </Form.Text>
                                    </div>

                                    <Form.Control
                                        type="number"
                                        placeholder="0.0"
                                        value={outputAmount === 0 ? "" : outputAmount }
                                        disabled
                                        />

                                        <Dropdown className="mt-2">
                                        <Dropdown.Toggle
                                            variant="outline-secondary"
                                            className="w-100"
                                        >
                                            {outputToken ? outputToken : "Select Token"}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="w-100">
                                            <Dropdown.Item onClick={() => setOutputToken("QP")}>QP</Dropdown.Item>
                                            <Dropdown.Item onClick={() => setOutputToken("USD")}>USD</Dropdown.Item>
                                        </Dropdown.Menu>
                                        </Dropdown>                                
                                </Row>

                                <Row className='my-3'>
                                    {isSwapping ? (
                                        <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
                                    ) : (
                                        <Button 
                                            type='submit' 
                                            className="submit-buttons"
                                            style={{ marginTop: '-8px' }}
                                        >
                                            Trade
                                        </Button>
                                    )}

                                    <Form.Text muted style={{ marginLeft: '70px' }}>
                                        Exchange Rate: {price.toString().slice(0, 10)}
                                    </Form.Text>
                                </Row>

                            </Form>
                        </div>
                    ) : (
                        <p
                        className='d-flex justify-content-center align-items-center'
                        style={{ 
                            height: '300px',
                            fontSize: '24px'
                        }}
                    >
                        Please connect wallet
                    </p>
                    )}
                </Card>

                {isSwapping ? (
                    <Alert 
                        message={'Trade Pending...'}
                        transactionHash={null}
                        setShowAlert={setShowAlert}
                        style={{
                            border: '2px solid #062f6e',
                            color: '#062f6e',
                        }}
                        
                    />
                ) : isSuccess && showAlert ? (
                    <>
                        <Alert
                            message={'Trade Successful'}
                            transactionHash={transactionHash}
                            setShowAlert={setShowAlert}
                            style={{
                                border: '2px solid #014421',           
                                color: '#014421' 
                            }}
                            
                            
                        />
                        {transactionHash && (
                            <p style={{ marginTop: '-30px', 
                                        textAlign: 'left', 
                                        fontSize: '16px', 
                                        marginLeft: '-80px', 
                                        fontWeight: 'bold' }}>
                                View on{' '}
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Etherscan
                                </a>
                            </p>
                        )}
                    </>
                ) : !isSuccess && showAlert ? (
                    <Alert
                        message={'Trade Failure'}
                        transactionHash={null}
                        setShowAlert={setShowAlert}
                        style={{
                            border: '2px solid #5b0f14',
                            color: '#5b0f14',
                        }}
                    />
                ) : (
                    <></>
                )}                    
            </div>
        </div>
    );
}

export default Trade;