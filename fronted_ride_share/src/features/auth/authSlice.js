import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { apiClient } from '../../api/apiClient'
import endpoints from '../../api/endpoints'
import { secureStorage, AUTH_STORAGE_KEY } from '../../utils/secureStorage'

const persistedAuth = secureStorage.get(AUTH_STORAGE_KEY, null)
const PENDING_VERIFICATION_KEY = 'ride-sharing/pending-verification-email'
const persistedPendingEmail = secureStorage.get(PENDING_VERIFICATION_KEY, null)

const initialState = {
  user: persistedAuth?.user ?? null,
  token: persistedAuth?.token ?? null,
  refreshToken: persistedAuth?.refreshToken ?? null,
  status: 'idle',
  error: null,
  initializing: false,
  pendingVerificationEmail: persistedPendingEmail,
  verificationStatus: 'idle',
  verificationMessage: null,
  verificationError: null,
  registrationMessage: null,
  resendStatus: 'idle',
  resendMessage: null,
  otpHint: null,
}

const isHtmlBlob = (value) =>
  typeof value === 'string' && (value.includes('<!DOCTYPE') || value.includes('<html'))

const friendlyHttpMessage = (status) => {
  if (status === 502 || status === 503 || status === 504) {
    return 'Server is waking up (Render free tier). Wait about a minute and try again.'
  }
  if (status === 500) {
    return 'Server error. Please try again in a moment.'
  }
  return null
}

const handleError = (error) => {
  const status = error?.response?.status
  const gatewayHint = friendlyHttpMessage(status)
  if (gatewayHint) {
    return gatewayHint
  }

  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') {
      if (isHtmlBlob(data)) {
        return friendlyHttpMessage(status) || 'Service temporarily unavailable. Please try again.'
      }
      return data
    }
    if (data.message && !isHtmlBlob(data.message)) {
      return data.message
    }
    if (data.error && !isHtmlBlob(data.error)) {
      return data.error
    }
  }

  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Server is taking too long (cold start). Wait a minute and try again.'
  }
  if (error?.message?.includes('Network Error')) {
    return 'Network error. Please check your connection and try again.'
  }
  if (error?.message && !isHtmlBlob(error.message)) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('Register API call:', endpoints.auth.register, payload)
      const { data } = await apiClient.post(endpoints.auth.register, payload)
      console.log('Register API response:', data)
      return data
    } catch (error) {
      console.error('Register API error:', error)
      return rejectWithValue(handleError(error))
    }
  },
)

export const loginUser = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    console.log('Login API call:', endpoints.auth.login, payload)
    const { data } = await apiClient.post(endpoints.auth.login, payload)
    console.log('Login API response:', data)
    return data
  } catch (error) {
    console.error('Login API error:', error)
    return rejectWithValue(handleError(error))
  }
})

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload, { rejectWithValue }) => {
    try {
      console.log('Verifying OTP with payload:', { ...payload, otp: '***' })
      console.log('OTP endpoint:', endpoints.auth.verifyOtp)
      const { data } = await apiClient.post(endpoints.auth.verifyOtp, payload)
      console.log('OTP verification response:', data)
      return data
    } catch (error) {
      console.error('OTP verification error:', error)
      console.error('Error response:', error?.response)
      console.error('Error data:', error?.response?.data)
      return rejectWithValue(handleError(error))
    }
  },
)

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(endpoints.auth.resendOtp, payload)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

export const fetchProfile = createAsyncThunk(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get(endpoints.auth.profile)
      return data
    } catch (error) {
      return rejectWithValue(handleError(error))
    }
  },
)

const persistAuth = (state) => {
  secureStorage.set(AUTH_STORAGE_KEY, {
    user: state.user,
    token: state.token,
    refreshToken: state.refreshToken,
  })
}

const clearAuth = () => {
  secureStorage.remove(AUTH_STORAGE_KEY)
}

const setPendingVerificationEmail = (email) => {
  if (email) {
    secureStorage.set(PENDING_VERIFICATION_KEY, email)
  } else {
    secureStorage.remove(PENDING_VERIFICATION_KEY)
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    refreshTokenSuccess: (state, action) => {
      state.token = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken
      persistAuth(state)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.status = 'idle'
      state.error = null
      state.pendingVerificationEmail = null
      state.verificationStatus = 'idle'
      state.verificationMessage = null
      state.verificationError = null
      state.registrationMessage = null
      state.otpHint = null
      clearAuth()
      setPendingVerificationEmail(null)
    },
    clearPendingVerification: (state) => {
      state.pendingVerificationEmail = null
      state.verificationStatus = 'idle'
      state.verificationMessage = null
      state.verificationError = null
      state.otpHint = null
      setPendingVerificationEmail(null)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
        state.pendingVerificationEmail = null
        state.verificationStatus = 'idle'
        state.verificationMessage = null
        state.verificationError = null
        state.registrationMessage = null
        state.otpHint = null
        setPendingVerificationEmail(null)
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const payload = action.payload || {}

        if (payload.verificationRequired) {
          state.pendingVerificationEmail = payload.email
          state.verificationStatus = 'pending'
          state.verificationMessage = payload.message
          state.registrationMessage = payload.message
          state.otpHint = payload.otpHint || null
          setPendingVerificationEmail(payload.email)
          state.user = null
          state.token = null
          state.refreshToken = null
          clearAuth()
        } else {
          state.user = {
            id: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
          }
          state.token = payload.token || payload.accessToken || null
          state.refreshToken = payload.refreshToken || null
          persistAuth(state)
          setPendingVerificationEmail(null)
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
        state.pendingVerificationEmail = null
        state.verificationStatus = 'idle'
        state.verificationMessage = null
        state.verificationError = null
        state.registrationMessage = null
        setPendingVerificationEmail(null)
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Backend returns token, userId, email, name, role directly (not nested in user object)
        state.user = {
          id: action.payload.userId,
          email: action.payload.email,
          name: action.payload.name,
          role: action.payload.role,
        }
        state.token = action.payload.token || action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        persistAuth(state)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload
        persistAuth(state)
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(verifyOtp.pending, (state) => {
        state.verificationStatus = 'loading'
        state.verificationError = null
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verificationStatus = 'succeeded'
        state.verificationMessage = action.payload?.message || 'Verification successful! You can now login with your credentials.'
        state.registrationMessage = action.payload?.message || 'Verification successful! You can now login with your credentials.'
        // Keep pendingVerificationEmail for redirect - will be cleared when user navigates away
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verificationStatus = 'failed'
        state.verificationError = action.payload
      })
      .addCase(resendOtp.pending, (state) => {
        state.resendStatus = 'loading'
        state.resendMessage = null
        state.verificationError = null
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.resendStatus = 'succeeded'
        state.resendMessage = action.payload?.message || 'OTP resent successfully. Check your email.'
        state.registrationMessage = state.resendMessage
        state.otpHint = action.payload?.otpHint || null
        if (action.payload?.email) {
          state.pendingVerificationEmail = action.payload.email
          setPendingVerificationEmail(action.payload.email)
        }
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.resendStatus = 'failed'
        state.verificationError = action.payload
      })
  },
})

export const { refreshTokenSuccess, logout, clearPendingVerification } = authSlice.actions

export default authSlice.reducer

