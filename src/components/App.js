import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'


// Components
import Navigation from './Navigation';
import Tabs from './Tabs'
import Swap from './Swap'
import Deposit from './Deposit'
import Withdraw from './Withdraw'
import History from './History'



import {  
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadQUANTIPOOL
} from '../store/interactions'

function App() {
  const canvasRef = useRef(null)

  

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    let width = canvas.width;
    let height = canvas.height;
  
    const trail = [];
    const MAX_TRAIL = 20;
  
    const handleMouseMove = (e) => {
      trail.push({ x: e.clientX, y: e.clientY, alpha: 1, radius: 0 });
      if (trail.length > MAX_TRAIL) trail.shift();
    };
    window.addEventListener('mousemove', handleMouseMove);
  
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
  
      trail.forEach((point, i) => {
        point.radius += 3;       // expands
        point.alpha *= 0.9;        // fades
  
        // draw ripple on both sides of cursor
        const rippleCount = 5;
        for (let r = 0; r < rippleCount; r++) {
          const angle = (r / rippleCount) * Math.PI * 2;
          const offsetX = Math.sin(angle + point.radius / 10) * (5 + r * 2);
          const offsetY = Math.cos(angle + point.radius / 10) * (5 + r * 2);
  
          ctx.beginPath();
          ctx.arc(point.x + offsetX, point.y + offsetY, point.radius, 0, Math.PI * 2);
  
          // glassy effect
          ctx.strokeStyle = `rgba(255,255,255,${point.alpha * 0.05})`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(255,255,255,${point.alpha * 0.10})`;
          ctx.stroke();
        }
      });
  
      // remove fully faded points
      while (trail.length && trail[0].alpha < 0.01) trail.shift();
  
      requestAnimationFrame(draw);
    };
  
    draw();
  
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
  
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      <Container>
        <HashRouter>
          <Navigation />
          
          <Tabs />
          <Routes>
            <Route exact path="/" element={<Swap />} />
            <Route exact path="deposit" element={<Deposit />} />
            <Route exact path="withdraw" element={<Withdraw />} />
            <Route exact path="charts" element={<History />} />
          </Routes>
        </HashRouter>
      </Container>
    </>
  );
}

export default App;