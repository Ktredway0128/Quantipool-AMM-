import { createSlice } from '@reduxjs/toolkit'

export const quantipool = createSlice({
    name: 'quantipool',
    initialState: {
        contract: null,
        shares: 0,
        swaps: []
    },
    reducers: {
        setContract: (state, action) => {
            state.contract = action.payload
        },
        sharesLoaded: (state, action) => {
            state.shares = action.payload
        }
    }  
})

export const { setContract, sharesLoaded } = quantipool.actions;

export default quantipool.reducer;