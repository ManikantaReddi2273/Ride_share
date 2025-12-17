import { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'

import PageContainer from '../../components/common/PageContainer'
import { logout } from '../auth/authSlice'
import { apiClient } from '../../api/apiClient'
import endpoints from '../../api/endpoints'

const SETTINGS_STORAGE_KEY = 'smartride_notification_settings'

const SettingsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const { user } = useSelector((state) => state.auth)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  // Notification preferences - load from localStorage
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [rideUpdates, setRideUpdates] = useState(true)
  const [paymentNotifications, setPaymentNotifications] = useState(true)

  // Load notification settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setEmailNotifications(settings.emailNotifications ?? true)
        setPushNotifications(settings.pushNotifications ?? true)
        setRideUpdates(settings.rideUpdates ?? true)
        setPaymentNotifications(settings.paymentNotifications ?? true)
      } catch (e) {
        console.error('Error loading notification settings:', e)
      }
    }
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    enqueueSnackbar('Logged out successfully', { variant: 'success' })
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      // Save to localStorage
      const settings = {
        emailNotifications,
        pushNotifications,
        rideUpdates,
        paymentNotifications,
      }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      
      // TODO: Save to backend API when endpoint is available
      // await apiClient.put('/users/notification-preferences', settings)
      
      enqueueSnackbar('Notification settings saved successfully', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to save settings', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    // Validation
    const errors = {}
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required'
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters'
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordErrors({})
    setSaving(true)

    try {
      await apiClient.put(endpoints.auth.changePassword, {
        currentPassword,
        newPassword,
      })
      
      // Reset form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangePasswordDialogOpen(false)
      enqueueSnackbar('Password changed successfully', { variant: 'success' })
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to change password'
      setPasswordErrors({ submit: errorMessage })
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    try {
      await apiClient.delete(endpoints.auth.deleteAccount)
      setDeleteAccountDialogOpen(false)
      enqueueSnackbar('Account deleted successfully', { variant: 'success' })
      // Logout and redirect to login
      dispatch(logout())
      navigate('/login')
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete account'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Account Information */}
        <Grid item xs={12} lg={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <PersonRoundedIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    Account Information
                  </Typography>
                </Box>
                <Divider />
                <Stack spacing={2.5}>
                  <TextField
                    label="Name"
                    value={user?.name || ''}
                    fullWidth
                    disabled
                    variant="outlined"
                    helperText="Contact support to change your name"
                  />
                  <TextField
                    label="Email"
                    value={user?.email || ''}
                    fullWidth
                    disabled
                    variant="outlined"
                    helperText="Contact support to change your email"
                  />
                  <TextField
                    label="Phone"
                    value={user?.phone || 'Not provided'}
                    fullWidth
                    disabled
                    variant="outlined"
                    helperText="Contact support to change your phone number"
                  />
                  <TextField
                    label="Role"
                    value={user?.role || 'N/A'}
                    fullWidth
                    disabled
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} lg={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <NotificationsRoundedIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    Notifications
                  </Typography>
                </Box>
                <Divider />
                <Stack spacing={2.5}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            Email Notifications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receive updates via email
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={pushNotifications}
                          onChange={(e) => setPushNotifications(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            Push Notifications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receive browser push notifications
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={rideUpdates}
                          onChange={(e) => setRideUpdates(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            Ride Updates
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Get notified about ride status changes
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={paymentNotifications}
                          onChange={(e) => setPaymentNotifications(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            Payment Notifications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receive payment confirmations and updates
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveRoundedIcon />}
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    sx={{ mt: 2 }}
                  >
                    {saving ? 'Saving...' : 'Save Notifications'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Security */}
        <Grid item xs={12} lg={6}>
          <Card elevation={2}>
            <CardContent>
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <SecurityRoundedIcon />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>
                    Security
                  </Typography>
                </Box>
                <Divider />
                <Stack spacing={2}>
                  <Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      onClick={() => setChangePasswordDialogOpen(true)}
                      sx={{ py: 1.5 }}
                    >
                      Change Password
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Update your password to keep your account secure
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Danger Zone - Small at bottom */}
      <Box mt={4}>
        <Card elevation={1} sx={{ border: '1px solid', borderColor: 'error.light', bgcolor: 'rgba(211, 47, 47, 0.02)' }}>
          <CardContent sx={{ py: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <DeleteForeverRoundedIcon sx={{ color: 'error.main', fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600} color="error">
                  Danger Zone
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={() => setLogoutDialogOpen(true)}
                >
                  Logout
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteForeverRoundedIcon />}
                  onClick={() => setDeleteAccountDialogOpen(true)}
                >
                  Delete Account
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onClose={() => setChangePasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setPasswordErrors({ ...passwordErrors, currentPassword: '' })
              }}
              fullWidth
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                      {showCurrentPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setPasswordErrors({ ...passwordErrors, newPassword: '' })
              }}
              fullWidth
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword || 'Minimum 8 characters'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setPasswordErrors({ ...passwordErrors, confirmPassword: '' })
              }}
              fullWidth
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {passwordErrors.submit && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {passwordErrors.submit}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out? You will need to sign in again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained" startIcon={<LogoutRoundedIcon />}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <DialogContentText>
            Are you sure you want to permanently delete your account? This will remove all your data including:
            <ul>
              <li>Your profile information</li>
              <li>All your rides and bookings</li>
              <li>Payment history</li>
              <li>Reviews and ratings</li>
            </ul>
            This action is permanent and cannot be reversed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={saving}
            startIcon={<DeleteForeverRoundedIcon />}
          >
            {saving ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  )
}

export default SettingsPage
