import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import { loginUser } from './authSlice'
import { apiClient } from '../../api/apiClient'
import endpoints from '../../api/endpoints'

const schema = yup.object().shape({
  emailOrPhone: yup.string().required('Email or phone is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
})

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { status, error, token } = useSelector((state) => state.auth)
  const successMessage = location.state?.message
  const preFilledEmail = location.state?.email
  const [localSuccessMessage, setLocalSuccessMessage] = useState(null)

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [fpStep, setFpStep] = useState('request') // 'request' | 'reset'
  const [fpEmail, setFpEmail] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [fpNewPassword, setFpNewPassword] = useState('')
  const [fpConfirmPassword, setFpConfirmPassword] = useState('')
  const [fpMessage, setFpMessage] = useState(null)
  const [fpError, setFpError] = useState(null)
  const [fpLoading, setFpLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      emailOrPhone: preFilledEmail || '',
      password: '',
    },
  })

  // Auto-fill email if provided via navigation state
  useEffect(() => {
    if (preFilledEmail) {
      setValue('emailOrPhone', preFilledEmail)
    }
  }, [preFilledEmail, setValue])

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [token, navigate])

  const onSubmit = (values) => {
    try {
      console.log('Logging in with:', { emailOrPhone: values.emailOrPhone, password: '***' })
      dispatch(loginUser(values))
    } catch (err) {
      console.error('Login form error:', err)
    }
  }

  const resetForgotState = () => {
    setFpStep('request')
    setFpEmail('')
    setFpOtp('')
    setFpNewPassword('')
    setFpConfirmPassword('')
    setFpMessage(null)
    setFpError(null)
    setFpLoading(false)
  }

  const handleRequestOtp = async () => {
    if (!fpEmail) {
      setFpError('Email is required')
      return
    }
    setFpError(null)
    setFpMessage(null)
    setFpLoading(true)
    try {
      const response = await apiClient.post(endpoints.auth.forgotPassword, { email: fpEmail })
      if (response?.data?.success || response?.data?.message) {
        setFpStep('reset')
        setFpMessage(response?.data?.message || 'OTP sent to your email. Please check your inbox.')
      } else {
        setFpError('Unexpected response from server')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      const errorData = err?.response?.data
      const msg = errorData?.message || errorData?.error || err?.message || 'Failed to send OTP. Please try again.'
      setFpError(msg)
    } finally {
      setFpLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!fpOtp) {
      setFpError('OTP is required')
      return
    }
    if (!fpNewPassword || fpNewPassword.length < 8) {
      setFpError('New password must be at least 8 characters')
      return
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpError('Passwords do not match')
      return
    }

    setFpError(null)
    setFpMessage(null)
    setFpLoading(true)
    try {
      const response = await apiClient.post(endpoints.auth.resetPassword, {
        email: fpEmail,
        otp: fpOtp,
        newPassword: fpNewPassword,
      })
      if (response?.data?.success || response?.data?.message) {
        setLocalSuccessMessage(response?.data?.message || 'Password updated. Please sign in with your new password.')
        setValue('emailOrPhone', fpEmail)
        setForgotOpen(false)
        resetForgotState()
      } else {
        setFpError('Unexpected response from server')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      const errorData = err?.response?.data
      const msg = errorData?.message || errorData?.error || err?.message || 'Failed to reset password. Please try again.'
      setFpError(msg)
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#E8F8F5',
        p: 3,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} mb={4} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(15, 139, 141, 0.12)',
                color: 'primary.main',
              }}
            >
              <DirectionsCarFilledRoundedIcon fontSize="large" />
            </Box>
            <Typography variant="h4" fontWeight={700}>
              Smart Ride Sharing
            </Typography>
            <Typography color="text.secondary">
              Sign in to manage your rides and bookings
            </Typography>
          </Stack>

          {(successMessage || localSuccessMessage) && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage || localSuccessMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="Email or Phone"
              {...register('emailOrPhone')}
              error={!!errors.emailOrPhone}
              helperText={errors.emailOrPhone?.message || 'Enter your email address or phone number'}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              fullWidth
            />
            <Box display="flex" justifyContent="flex-end">
              <Button
                size="small"
                variant="text"
                onClick={() => setForgotOpen(true)}
                sx={{ textTransform: 'none', color: '#0F8B8D', fontWeight: 600 }}
              >
                Forgot password?
              </Button>
            </Box>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LoginRoundedIcon />}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>

          <Typography textAlign="center" mt={3} variant="body2">
            New to the platform?{' '}
            <Link to="/register" style={{ color: '#0F8B8D', fontWeight: 600 }}>
              Create an account
            </Link>
          </Typography>
          <Typography textAlign="center" mt={2} variant="body2">
            <Link to="/landing" style={{ color: '#0F8B8D', fontWeight: 500 }}>
              ← Back to Home
            </Link>
          </Typography>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => { setForgotOpen(false); resetForgotState() }} fullWidth maxWidth="xs">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} mt={1}>
            {fpStep === 'request' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Enter your registered email to receive a reset OTP.
                </Typography>
                <TextField
                  label="Email"
                  type="email"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  fullWidth
                  autoFocus
                />
              </>
            )}

            {fpStep === 'reset' && (
              <>
                <Alert severity="info">
                  OTP sent to {fpEmail}. Enter the OTP and choose a new password.
                </Alert>
                <TextField
                  label="OTP"
                  value={fpOtp}
                  onChange={(e) => setFpOtp(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="New Password"
                  type="password"
                  value={fpNewPassword}
                  onChange={(e) => setFpNewPassword(e.target.value)}
                  fullWidth
                  helperText="Minimum 8 characters"
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={fpConfirmPassword}
                  onChange={(e) => setFpConfirmPassword(e.target.value)}
                  fullWidth
                />
              </>
            )}

            {fpMessage && (
              <Alert severity="success">
                {fpMessage}
              </Alert>
            )}
            {fpError && (
              <Alert severity="error">
                {fpError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setForgotOpen(false); resetForgotState() }} disabled={fpLoading}>
            Cancel
          </Button>
          {fpStep === 'request' ? (
            <Button onClick={handleRequestOtp} variant="contained" disabled={fpLoading}>
              {fpLoading ? 'Sending...' : 'Send OTP'}
            </Button>
          ) : (
            <Button onClick={handleResetPassword} variant="contained" disabled={fpLoading}>
              {fpLoading ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LoginPage

