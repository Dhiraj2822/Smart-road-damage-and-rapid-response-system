import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { complaintAPI } from '../services/api';

export const createComplaint = createAsyncThunk(
  'complaints/create',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await complaintAPI.create(formData);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to submit complaint');
    }
  }
);

export const fetchMyComplaints = createAsyncThunk(
  'complaints/fetchMy',
  async (params, { rejectWithValue }) => {
    try {
      const response = await complaintAPI.getMy(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch complaints');
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaints/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await complaintAPI.getById(id);
      return response.data.complaint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch complaint');
    }
  }
);

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: {
    list: [],
    current: null,
    pagination: null,
    loading: false,
    error: null,
    submitSuccess: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSubmitSuccess: (state) => {
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createComplaint.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.submitSuccess = false;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.loading = false;
        state.submitSuccess = true;
        state.list.unshift(action.payload);
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.complaints;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchComplaintById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSubmitSuccess } = complaintsSlice.actions;
export default complaintsSlice.reducer;
