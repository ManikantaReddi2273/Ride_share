import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { apiClient } from '../../api/apiClient'
import endpoints from '../../api/endpoints'

const initialState = {
  users: [],
  rides: [],
  bookings: [],
  payments: [],
  rideStatistics: null,
  paymentStatistics: null,
  monthlyStatistics: null,
  monthlyPaymentStatistics: null,
  loading: false,
  loadingRides: false,
  loadingBookings: false,
  loadingPayments: false,
  loadingStatistics: false,
  error: null,
  creatingAdmin: false,
  createAdminError: null,
}

const handleError = (error) => {
  // Handle service discovery errors
  if (error?.message?.includes('Unable to find instance') || 
      error?.message?.includes('LoadBalancer') ||
      error?.code === 'ECONNREFUSED') {
    return 'Service temporarily unavailable. Please ensure all backend services are running.'
  }
  
  // Handle 404 errors
  if (error?.response?.status === 404) {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    return 'Resource not found. Please check if the service is running.'
  }
  
  // Handle 403 errors
  if (error?.response?.status === 403) {
    return 'Access denied. Admin privileges required.'
  }
  
  if (error?.response?.data) {
    if (error.response.data.message) {
      return error.response.data.message
    }
    if (error.response.data.error) {
      return error.response.data.error
    }
    if (typeof error.response.data === 'string') {
      return error.response.data
    }
  }
  if (error?.message) {
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return 'Network error. Please check your connection and try again.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching users from:', endpoints.admin.users)
      
      // Always go through the API Gateway using the default apiClient baseURL.
      // This ensures consistent routing and JWT header handling for admin endpoints.
      const response = await apiClient.get(endpoints.admin.users)
      console.log('✅ Full API response:', response)
      console.log('📦 Response data:', response.data)
      console.log('📊 Response data type:', typeof response.data)
      console.log('📊 Is array?', Array.isArray(response.data))
      
      // Handle different response formats
      let usersData = response.data
      
      // If response.data is not an array, check if it's wrapped
      if (!Array.isArray(usersData)) {
        console.warn('⚠️ Response data is not an array, checking for wrapper...')
        // Check if it's wrapped in a data property
        if (usersData && usersData.data && Array.isArray(usersData.data)) {
          usersData = usersData.data
          console.log('✅ Found users in response.data.data')
        } else if (usersData && usersData.users && Array.isArray(usersData.users)) {
          usersData = usersData.users
          console.log('✅ Found users in response.data.users')
        } else {
          console.error('❌ Unexpected response format:', usersData)
          return rejectWithValue('Unexpected response format from server')
        }
      }
      
      console.log('✅ Returning users data:', usersData)
      console.log('📊 Number of users:', usersData.length)
      return usersData
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      console.error('❌ Error response:', error?.response)
      console.error('❌ Error data:', error?.response?.data)
      console.error('❌ Error status:', error?.response?.status)
      return rejectWithValue(handleError(error))
    }
  },
)

export const createAdmin = createAsyncThunk(
  'admin/createAdmin',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(endpoints.admin.createAdmin, payload)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const blockUser = createAsyncThunk(
  'admin/blockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(endpoints.admin.blockUser(userId))
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const unblockUser = createAsyncThunk(
  'admin/unblockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(endpoints.admin.unblockUser(userId))
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchAllRides = createAsyncThunk(
  'admin/fetchAllRides',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.rides)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchAllBookings = createAsyncThunk(
  'admin/fetchAllBookings',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.bookings)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchAllPayments = createAsyncThunk(
  'admin/fetchAllPayments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.payments)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchRideStatistics = createAsyncThunk(
  'admin/fetchRideStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.rideStatistics)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchPaymentStatistics = createAsyncThunk(
  'admin/fetchPaymentStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.paymentStatistics)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchMonthlyStatistics = createAsyncThunk(
  'admin/fetchMonthlyStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.monthlyStatistics)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchMonthlyPaymentStatistics = createAsyncThunk(
  'admin/fetchMonthlyPaymentStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.admin.monthlyPaymentStatistics)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.createAdminError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false
        // Ensure payload is an array
        if (Array.isArray(action.payload)) {
          state.users = action.payload
          console.log('✅ Users stored in Redux:', state.users.length, 'users')
          if (state.users.length > 0) {
            console.log('📋 First user sample:', state.users[0])
          }
        } else {
          console.error('❌ Payload is not an array:', action.payload)
          state.users = []
        }
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        console.error('❌ fetchAllUsers rejected:', action.payload)
        console.error('❌ Error details:', action.error)
        // Keep existing users if any, don't clear them on error
      })
      // Create admin
      .addCase(createAdmin.pending, (state) => {
        state.creatingAdmin = true
        state.createAdminError = null
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.creatingAdmin = false
        state.users.push(action.payload)
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.creatingAdmin = false
        state.createAdminError = action.payload
      })
      // Block user
      .addCase(blockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
      })
      // Unblock user
      .addCase(unblockUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
      })
      // Fetch all rides
      .addCase(fetchAllRides.pending, (state) => {
        state.loadingRides = true
      })
      .addCase(fetchAllRides.fulfilled, (state, action) => {
        state.loadingRides = false
        state.rides = action.payload
      })
      .addCase(fetchAllRides.rejected, (state, action) => {
        state.loadingRides = false
        state.error = action.payload
      })
      // Fetch all bookings
      .addCase(fetchAllBookings.pending, (state) => {
        state.loadingBookings = true
      })
      .addCase(fetchAllBookings.fulfilled, (state, action) => {
        state.loadingBookings = false
        state.bookings = action.payload
      })
      .addCase(fetchAllBookings.rejected, (state, action) => {
        state.loadingBookings = false
        state.error = action.payload
      })
      // Fetch all payments
      .addCase(fetchAllPayments.pending, (state) => {
        state.loadingPayments = true
      })
      .addCase(fetchAllPayments.fulfilled, (state, action) => {
        state.loadingPayments = false
        state.payments = action.payload
      })
      .addCase(fetchAllPayments.rejected, (state, action) => {
        state.loadingPayments = false
        state.error = action.payload
      })
      // Fetch ride statistics
      .addCase(fetchRideStatistics.pending, (state) => {
        state.loadingStatistics = true
      })
      .addCase(fetchRideStatistics.fulfilled, (state, action) => {
        state.loadingStatistics = false
        state.rideStatistics = action.payload
      })
      .addCase(fetchRideStatistics.rejected, (state, action) => {
        state.loadingStatistics = false
        state.error = action.payload
      })
      // Fetch payment statistics
      .addCase(fetchPaymentStatistics.pending, (state) => {
        state.loadingStatistics = true
      })
      .addCase(fetchPaymentStatistics.fulfilled, (state, action) => {
        state.loadingStatistics = false
        state.paymentStatistics = action.payload
      })
      .addCase(fetchPaymentStatistics.rejected, (state, action) => {
        state.loadingStatistics = false
        state.error = action.payload
      })
      // Fetch monthly statistics
      .addCase(fetchMonthlyStatistics.pending, (state) => {
        state.loadingStatistics = true
      })
      .addCase(fetchMonthlyStatistics.fulfilled, (state, action) => {
        state.loadingStatistics = false
        state.monthlyStatistics = action.payload
      })
      .addCase(fetchMonthlyStatistics.rejected, (state, action) => {
        state.loadingStatistics = false
        state.error = action.payload
      })
      // Fetch monthly payment statistics
      .addCase(fetchMonthlyPaymentStatistics.pending, (state) => {
        state.loadingStatistics = true
      })
      .addCase(fetchMonthlyPaymentStatistics.fulfilled, (state, action) => {
        state.loadingStatistics = false
        state.monthlyPaymentStatistics = action.payload
      })
      .addCase(fetchMonthlyPaymentStatistics.rejected, (state, action) => {
        state.loadingStatistics = false
        state.error = action.payload
      })
  },
})

export const { clearError } = adminSlice.actions
export default adminSlice.reducer

