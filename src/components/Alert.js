import React from 'react';

const Alert = ({ 
    message, 
    transactionHash, 
    setShowAlert, 
    style 
}) => {
    return (
        <div
            style={{
                position: 'relative',
                borderRadius: '16px',               // a bit rounder like your cards
                padding: '45px',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '26px',
                background: 'rgba(255, 255, 255, 0.05)',  // semi-transparent
                backdropFilter: 'blur(8px)',        // glass effect
                WebkitBackdropFilter: 'blur(8px)',  // Safari support
                border: '1px solid rgba(255, 255, 255, 0.3)', // subtle border
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                color: '#062f6e',
                width: '100%',
                maxWidth: '300px',
                margin: '-60px 0 60px -80px',
                ...style
            }}
        >
            {/* Close button */}
            <button
                onClick={() => setShowAlert(false)}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '10px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: '#062f6e'
                }}
            >
                &times;
            </button>

            {/* Message */}
            <div style={{ marginBottom: '10px' }}>
                {message}
            </div>

            {/* Transaction hash */}
            {transactionHash && (
                <p style={{ margin: 0, fontSize: '14px' }}>
                    {transactionHash.slice(0, 6) + '...' + transactionHash.slice(60, 66)}
                </p>
            )}
        </div>
    );
};

export default Alert;
