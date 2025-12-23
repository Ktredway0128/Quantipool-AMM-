import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import quantipool from './reducers/quantipool'

export const store = configureStore({
  reducer: {
    provider,
    tokens,
    quantipool
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})