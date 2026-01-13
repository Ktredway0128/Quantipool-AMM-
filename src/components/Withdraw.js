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
    removeLiquidity,
    loadBalances
} from '../store/interactions';
import { quantipool } from '../store/reducers/quantipool';


const Withdraw = () => {
    const [amount, setAmount] = useState(0)

    const [showAlert, setShowAlert] = useState(false)


    const provider = useSelector(state=> state.provider.connection)
    const account = useSelector(state => state.provider.account)

    const shares = useSelector(state => state.quantipool.shares)

    const tokens = useSelector(state => state.tokens.contracts)
    const balances = useSelector(state => state.tokens.balances)

    const quantipool = useSelector(state => state.quantipool.contract)
    const isWithdrawing = useSelector(state => state.quantipool.withdrawing.isWithdrawing)
    const isSuccess = useSelector(state => state.quantipool.withdrawing.isSuccess)
    const transactionHash = useSelector(state => state.quantipool.withdrawing.transactionHash)
    const dispatch = useDispatch()


    const withdrawHandler = async (e) => {
        e.preventDefault()

        setShowAlert(false)

        const _shares = ethers.utils.parseUnits(amount.toString(), 'ether')

        await removeLiquidity(
            provider,
            quantipool,
            _shares,
            dispatch
        )

        await loadBalances(quantipool, tokens, account, dispatch)

        
        setShowAlert(true)
        setAmount(0)
    }

    return (
        <div>
            <Card className="glass-card circle-card mx-auto d-flex align-items-center justify-content-center">
                {account ? (
                    <Form onSubmit={withdrawHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
                        
                        <Row>
                            <Form.Text className='text-end my-2' muted>
                                Shares: {shares.toString().slice(0, 10)}
                            </Form.Text>
                            <InputGroup>
                                <Form.Control
                                    type="number"
                                    placeholder="0"
                                    min="0.0"
                                    step="any"
                                    id="shares"
                                    value={amount === 0 ? "" : amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <InputGroup.Text style={{ width: "100px" }} className="justify-content-center">
                                    Shares
                                </InputGroup.Text>
                            </InputGroup>
                        </Row>

                        <Row className='my-3'>
                            {isWithdrawing ? (
                                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
                            ) : (
                                <Button type="submit" className="submit-buttons">Withdraw</Button>
                            )}
                        </Row>

                        <hr />

                        <Row>
                            <p><strong>QP Balance:</strong> {balances[0].toString().slice(0, 10)}</p>
                            <p><strong>USD Balance:</strong> {balances[1].toString().slice(0, 10)}</p>
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

            {isWithdrawing? (
                <Alert 
                    message={'Withdraw Pending...'}
                    transactionHash={null}
                    variant={'info'}
                    setShowAlert={setShowAlert}
                />
            ) : isSuccess && showAlert ? (
                <Alert 
                    message={'Withdraw Successful'}
                    transactionHash={transactionHash}
                    variant={'success'}
                    setShowAlert={setShowAlert}
                />
            ) : !isSuccess && showAlert ? (
                <Alert 
                    message={'Withdraw Failure'}
                    transactionHash={null}
                    variant={'danger'}
                    setShowAlert={setShowAlert}
                />
            ) : (
                <></>
            )}                   
        </div>
    );
}

export default Withdraw;