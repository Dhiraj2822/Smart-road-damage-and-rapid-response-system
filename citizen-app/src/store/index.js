import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import complaintsReducer from './complaintsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
  },
});

export default store;
