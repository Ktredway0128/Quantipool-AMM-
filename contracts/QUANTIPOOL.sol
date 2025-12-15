//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract QUANTIPOOL {
    Token public tokenA;
    Token public tokenB;

    uint256 public tokenABalance;
    uint256 public tokenBBalance;
    uint256 public K;

    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 constant PRECISION = 10**18;

    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 tokenABalance,
        uint256 tokenBBalance,
        uint256 timestamp
    );

    constructor(Token _tokenA, Token _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 _tokenAAmount, uint256 _tokenBAmount) external {
        // Deposit Tokens
        require(
            tokenA.transferFrom(msg.sender, address(this), _tokenAAmount),
            "failed to transfer token A"
        );
        require(
            tokenB.transferFrom(msg.sender, address(this), _tokenBAmount),
            "failed to transfer token B"
        );

        // Distribute Shares
        uint256 share;

        // If adding liquidity for first time, make share 100
        if (totalShares == 0) {
            share = 100 * PRECISION;
        } else {
            uint256 shareA = (totalShares * _tokenAAmount) / tokenABalance;
            uint256 shareB = (totalShares * _tokenBAmount) / tokenBBalance;
            require(
                (shareA / 10**3) == (shareB / 10**3),
                "must submit equal amount of tokens"
            );
            share = shareA;
        }

        // Manage Pool
        tokenABalance += _tokenAAmount;
        tokenBBalance += _tokenBAmount;
        K = tokenABalance * tokenABalance;

        totalShares += share;
        shares[msg.sender] += share;

    }
 
    // ////// 
    //  NEWWWW evaluateTokenBDeposit 
    // Determine how many tokenA to deposit when depositing tokenB 
    
    function evaluateTokenBDeposit(uint256 _tokenAAmount)
    public
    view
    returns (uint256)
{
    return tokenBBalance * _tokenAAmount / tokenABalance;
}
    
    // ///////////
    // NEWWWWW evaluateTokenADeposit
    // Determine how many tokenA to deposit when depositing tokenB

    function evaluateTokenADeposit(uint256 _tokenBAmount)
    public
    view
    returns (uint256)
{
    return tokenABalance * _tokenBAmount / tokenBBalance;
}

    function evaluateTokenASwap(uint256 _tokenAAmount)
        public
        view
        returns (uint256)
    {
        // Returns the amount of tokenB received when swapping tokenA
        uint256 tokenAAfter = tokenABalance + _tokenAAmount;
        uint tokenBAfter = K / tokenAAfter;
        uint256 amountOut = tokenBBalance - tokenBAfter;

        // Don't let pool go to 0
        if(amountOut == tokenBBalance) {
            amountOut --;
        }

        require(amountOut < tokenBBalance, "swap amount exceeds limit");
        return amountOut;
    }

    function swapTokenA(uint256 _tokenAAmount) 
        external 
        returns(uint256 tokenBAmount) 
    {
        // Calculate TokenB Amount
        tokenBAmount = evaluateTokenASwap(_tokenAAmount);

        // Do Swap
        // Take tokenA from user to contract
        tokenA.transferFrom(msg.sender, address(this), _tokenAAmount);
        // Update balances
        tokenABalance += _tokenAAmount;
        tokenBBalance -= tokenBAmount;
        // Send tokenB to user
        tokenB.transfer(msg.sender, tokenBAmount);

        // Emit an event
        emit Swap(
            msg.sender,
            address(tokenA),
            _tokenAAmount,
            address(tokenB),
            tokenBAmount,
            tokenABalance,
            tokenBBalance,
            block.timestamp
        );
    }

    function evaluateTokenBSwap(uint256 _tokenBAmount)
        public
        view
        returns (uint256)
    {
        // Returns the amount of tokenB received when swapping tokenA
        uint256 tokenBAfter = tokenBBalance + _tokenBAmount;
        uint tokenAAfter = K / tokenBAfter;
        uint256 amountOut = tokenABalance - tokenAAfter;

        // Don't let pool go to 0
        if(amountOut == tokenABalance) {
            amountOut --;
        }

        require(amountOut < tokenABalance, "swap amount exceeds limit");
        return amountOut;
    }

    function swapTokenB(uint256 _tokenBAmount) 
        external 
        returns(uint256 tokenAAmount) 
    {
        // Calculate TokenA Amount
        tokenAAmount = evaluateTokenBSwap(_tokenBAmount);

        // Do Swap

        tokenB.transferFrom(msg.sender, address(this), _tokenBAmount);
        tokenBBalance += _tokenBAmount;
        tokenABalance -= tokenAAmount;
        tokenA.transfer(msg.sender, tokenAAmount);

        // Emit an event
        emit Swap(
            msg.sender,
            address(tokenB),
            _tokenBAmount,
            address(tokenA),
            tokenAAmount,
            tokenBBalance,
            tokenABalance,
            block.timestamp
        );
    }

    // Calculate how many tokens will be withdrawn
    function calculateWithdrawAmount(uint256 _share)
        public
        view
        returns(uint256, uint256)
    {
        require(_share <= totalShares, "invalid share amount");

        return (
            (_share * tokenABalance) / totalShares,
            (_share * tokenBBalance) / totalShares
        );

    }

    function removeLiquidity(uint256 _share)
        external
        returns (uint256 amountA, uint256 amountB)
    {
        require(_share <= shares[msg.sender], "share too large");

        (amountA, amountB) = calculateWithdrawAmount(_share);

    // Updating amounts
        uint256 userShares = shares[msg.sender] - _share;
        shares[msg.sender] = userShares;

        totalShares -= _share;

        tokenABalance -= amountA;
        tokenBBalance -= amountB;
        K = tokenABalance * tokenBBalance;

        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
    }

    
    

    
}