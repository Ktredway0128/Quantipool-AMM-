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
        }
    }  
})

export const { setContract } = quantipool.actions;

export default quantipool.reducer;