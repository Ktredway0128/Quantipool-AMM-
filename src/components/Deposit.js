import { ethers } from 'ethers';
import { useState } from'react';
import { useSelector, useDispatch } from 'react-redux';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'
import Row from 'react-bootstrap/Row';

import Alert from './Alert'

import { 
    addLiquidity, 
    loadBalances 
} from '../store/interactions';

const Deposit = () => {
    const [tokenAAmount, setTokenAAmount] = useState(0)
    const [tokenBAmount, setTokenBAmount] = useState(0)
    const [showAlert, setShowAlert] = useState(false)


    const provider = useSelector(state=> state.provider.connection)
    const account = useSelector(state => state.provider.account)

    const tokens = useSelector(state => state.tokens.contracts)
    const symbols = useSelector(state => state.tokens.symbols)
    const balances = useSelector(state => state.tokens.balances)

    const quantipool = useSelector(state => state.quantipool.contract)
    const isDepositing = useSelector(state => state.quantipool.depositing.isDepositing)
    const isSuccess = useSelector(state => state.quantipool.depositing.isSuccess)
    const transactionHash = useSelector(state => state.quantipool.depositing.transactionHash)

    const dispatch = useDispatch()


    const amountHandler = async (e) => {
        if (e.target.id === 'tokenA') {
            setTokenAAmount(e.target.value)

            // Fetch value from chain
            const _tokenAAmount = ethers.utils.parseUnits(e.target.value, 'ether')
            const result = await quantipool.evaluateTokenBDeposit(_tokenAAmount)
            const _tokenBAmount = ethers.utils.formatUnits(result.toString(), 'ether')

            setTokenBAmount(_tokenBAmount) 
        } else {
            setTokenBAmount(e.target.value)

            // Fetch value from chain
            const _tokenBAmount = ethers.utils.parseUnits(e.target.value, 'ether')
            const result = await quantipool.evaluateTokenADeposit(_tokenBAmount)
            const _tokenAAmount = ethers.utils.formatUnits(result.toString(), 'ether')

            setTokenAAmount(_tokenAAmount)
        }
    }

    const depositHandler = async (e) => {
        e.preventDefault()

        setShowAlert(false)

        const _tokenAAmount = ethers.utils.parseUnits(tokenAAmount, 'ether')
        const _tokenBAmount = ethers.utils.parseUnits(tokenBAmount, 'ether')

        await addLiquidity(
            provider, 
            quantipool, 
            tokens, 
            [_tokenAAmount, _tokenBAmount], 
            dispatch
        )

        await loadBalances(quantipool, tokens, account, dispatch)

        setShowAlert(true)
    }

    return (
        <div>
            <Card className="glass-card circle-card mx-auto d-flex align-items-center justify-content-center">
                {account ? (                    
                        <Form onSubmit={depositHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
                            
                            <Row>
                                <Form.Text className='text-end my-2' muted>
                                    Balance: {balances[0].toString().slice(0, 10)}
                                </Form.Text>
                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        placeholder="0.0"
                                        min="0.0"
                                        step="any"
                                        id="tokenA"
                                        onChange={(e) => amountHandler(e)}
                                        value={tokenAAmount === 0 ? "" : tokenAAmount}
                                    />
                                    <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">
                                        {symbols[0]}
                                    </InputGroup.Text>
                                </InputGroup>
                            </Row>

                            <Row className='my-3'>
                                <Form.Text className='text-end my-2' muted>
                                    Balance: {balances[1].toString().slice(0, 10)}
                                </Form.Text>
                                <InputGroup>
                                    <Form.Control
                                        type="number"
                                        placeholder="0.0"
                                        step="any"
                                        id="tokenB"
                                        onChange={(e) => amountHandler(e)}
                                        value={tokenBAmount === 0 ? "" : tokenBAmount}

                                    />
                                    <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">
                                        {symbols[1]}
                                    </InputGroup.Text>
                                </InputGroup>
                            </Row>

                            <Row className='my-3'>
                                {isDepositing ? (
                                    <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
                                ) : (
                                    <Button type="submit" className="submit-buttons">Deposit</Button>
                                )}
                            </Row>
                        </Form>
                    
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

            {isDepositing ? (
                <Alert
                    className="custom-alert" 
                    message={'Deposit Pending...'}
                    transactionHash={null}
                    setShowAlert={setShowAlert}
                />
            ) : isSuccess && showAlert ? (
                <Alert
                    className="custom-alert" 
                    message={'Deposit Successful'}
                    transactionHash={transactionHash}
                    setShowAlert={setShowAlert}
                />
            ) : !isSuccess && showAlert ? (
                <Alert
                    className="custom-alert" 
                    message={'Deposit Failure'}
                    transactionHash={null}
                    setShowAlert={setShowAlert}
                />
            ) : (
                <></>
            )}   
                 
        </div>
    );
}

export default Deposit;