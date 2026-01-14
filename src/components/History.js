import { useSelector, useDispatch } from 'react-redux'
import Table from 'react-bootstrap/Table';
import Chart from 'react-apexcharts';
import { ethers } from 'ethers'

import { options, series } from './Charts.config';
import { chartSelector } from '../store/selectors';
import { useEffect } from 'react'

import Loading from './Loading';

import {
  loadAllSwaps
} from '../store/interactions'

const History = () => {
  const provider = useSelector(state => state.provider.connection)

  const tokens = useSelector(state => state.tokens.contracts)
  const symbols = useSelector(state => state.tokens.symbols)

  const quantipool = useSelector(state => state.quantipool.contract)

  const chart = useSelector(chartSelector)

  const dispatch = useDispatch()

  useEffect(() => {
    if(provider && quantipool) {
      loadAllSwaps(provider, quantipool, dispatch)
    }
  }, [provider, quantipool, dispatch])

  return (
    <div>
        {provider && quantipool ? (
            <div 
                style={{ 
                    marginTop: '140px',
                    backgroundColor: 'rgba(19, 34, 60, 0.15)', /* dark navy with transparency */
                    borderRadius: '10px',
                    backdropFilter: 'blur(5px)', // blurs the image behind
                    
                }}
            >

                <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <Table striped bordered hover className="mb-0">
                        <thead>
                        <tr>
                            <th>Transaction Hash</th>
                            <th>Token Give</th>
                            <th>Amount Give</th>
                            <th>Token Get</th>
                            <th>Amount Get</th>
                            <th>User</th>
                            <th>Time</th>
                        </tr>
                        </thead>
                        <tbody>
                            {chart.swaps && 
                                // Sort by timestamp descending first, then take the first 6
                                chart.swaps
                                .slice() // make a copy to avoid mutating state
                                .sort((a, b) => Number(b.args.timestamp) - Number(a.args.timestamp)) // newest first
                                .slice(0, 6) // only keep 6
                                .map((swap, index) => (
                                    <tr key={index}>
                                    <td>{swap.hash.slice(0, 5) + '...' + swap.hash.slice(61, 66)}</td>
                                    <td>{swap.args.tokenGive === tokens[0].address ? symbols[0] : symbols[1]}</td>
                                    <td>{ethers.utils.formatUnits(swap.args.tokenGiveAmount.toString(), 'ether')}</td>
                                    <td>{swap.args.tokenGet === tokens[0].address ? symbols[0] : symbols[1]}</td>
                                    <td>{ethers.utils.formatUnits(swap.args.tokenGetAmount.toString(), 'ether')}</td>
                                    <td>{swap.args.user.slice(0, 5) + '...' + swap.args.user.slice(38, 42)}</td>
                                    <td>{new Date(Number(swap.args.timestamp.toString() + '000')).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        second: 'numeric'
                                    })}</td>
                                 </tr>
                            ))}
                        </tbody>

                    </Table>
                </div>
            </div>

        ) : (
            <Loading/>
        )}

    </div>
    );
}

export default History;








