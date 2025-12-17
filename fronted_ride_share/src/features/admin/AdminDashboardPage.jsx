import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import { BarChart, LineChart } from '@mui/x-charts'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import RefreshIcon from '@mui/icons-material/Refresh'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import PaymentIcon from '@mui/icons-material/Payment'
import AssessmentIcon from '@mui/icons-material/Assessment'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import {
  fetchAllUsers,
  createAdmin,
  blockUser,
  unblockUser,
  fetchAllRides,
  fetchAllBookings,
  fetchAllPayments,
  fetchRideStatistics,
  fetchPaymentStatistics,
  fetchMonthlyStatistics,
  fetchMonthlyPaymentStatistics,
  clearError,
} from './adminSlice'
import { useSnackbar } from 'notistack'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { logout } from '../auth/authSlice'

const AdminDashboardPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const {
    users,
    rides,
    bookings,
    payments,
    rideStatistics,
    paymentStatistics,
    monthlyStatistics,
    monthlyPaymentStatistics,
    loading,
    loadingRides,
    loadingBookings,
    loadingPayments,
    loadingStatistics,
    error,
    creatingAdmin,
    createAdminError,
  } = useSelector((state) => state.admin)

  const [tabValue, setTabValue] = useState(0)
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    name: '',
    password: '',
  })

  useEffect(() => {
    console.log('🔄 AdminDashboardPage: Fetching initial data...')
    dispatch(fetchAllUsers())
    dispatch(fetchRideStatistics())
    dispatch(fetchPaymentStatistics())
    dispatch(fetchMonthlyStatistics())
    dispatch(fetchMonthlyPaymentStatistics())
  }, [dispatch])

  // Debug effect to log users state changes
  useEffect(() => {
    console.log('👥 Users state updated:', {
      count: users?.length || 0,
      users: users,
      loading,
      error,
    })
  }, [users, loading, error])

  useEffect(() => {
    if (tabValue === 1) {
      dispatch(fetchAllRides())
    } else if (tabValue === 2) {
      dispatch(fetchAllBookings())
    } else if (tabValue === 3) {
      dispatch(fetchAllPayments())
    }
  }, [tabValue, dispatch])

  useEffect(() => {
    if (error) {
      // Only show error if it's not a service discovery error (those are expected if services aren't running)
      if (!error.includes('Service temporarily unavailable')) {
        enqueueSnackbar(error, { variant: 'error', autoHideDuration: 6000 })
      }
      dispatch(clearError())
    }
    if (createAdminError) {
      enqueueSnackbar(createAdminError, { variant: 'error', autoHideDuration: 6000 })
      dispatch(clearError())
    }
  }, [error, createAdminError, enqueueSnackbar, dispatch])

  const handleRefresh = () => {
    dispatch(fetchAllUsers())
    dispatch(fetchRideStatistics())
    dispatch(fetchPaymentStatistics())
    dispatch(fetchMonthlyStatistics())
    dispatch(fetchMonthlyPaymentStatistics())
    if (tabValue === 1) dispatch(fetchAllRides())
    if (tabValue === 2) dispatch(fetchAllBookings())
    if (tabValue === 3) dispatch(fetchAllPayments())
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    enqueueSnackbar('Logged out successfully', { variant: 'success' })
  }

  const handleCreateAdmin = async () => {
    try {
      await dispatch(createAdmin(formData)).unwrap()
      enqueueSnackbar('Admin user created successfully', { variant: 'success' })
      setCreateAdminDialogOpen(false)
      setFormData({ email: '', phone: '', name: '', password: '' })
      dispatch(fetchAllUsers())
    } catch (err) {
      // Error handled in useEffect
    }
  }

  const handleBlockUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to block this user?')
    if (!confirmed) {
      return
    }
    try {
      await dispatch(blockUser(userId)).unwrap()
      enqueueSnackbar('User blocked successfully', { variant: 'success' })
      dispatch(fetchAllUsers())
    } catch (err) {
      enqueueSnackbar(err || 'Failed to block user', { variant: 'error' })
    }
  }

  const handleUnblockUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to unblock this user?')
    if (!confirmed) {
      return
    }
    try {
      await dispatch(unblockUser(userId)).unwrap()
      enqueueSnackbar('User unblocked successfully', { variant: 'success' })
      dispatch(fetchAllUsers())
    } catch (err) {
      enqueueSnackbar(err || 'Failed to unblock user', { variant: 'error' })
    }
  }

  const userStats = {
    total: users?.length || 0,
    admins: users?.filter((u) => u.role === 'ADMIN').length || 0,
    drivers: users?.filter((u) => u.role === 'DRIVER').length || 0,
    passengers: users?.filter((u) => u.role === 'PASSENGER').length || 0,
    blocked: users?.filter((u) => u.status === 'BLOCKED').length || 0,
    active: users?.filter((u) => u.status === 'ACTIVE').length || 0,
  }

  // ======== Chart Data Helpers ========
  const buildMonthlySeries = (map) => {
    if (!map) return []
    return Object.entries(map)
      .filter(([month]) => month && month !== 'unknown')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, value }))
  }

  const getValueForMonth = (series, month) =>
    series.find((item) => item.month === month)?.value ?? 0

  // Ride & booking monthly counts (for bar chart)
  const monthlyRideSeries = buildMonthlySeries(monthlyStatistics?.monthlyRides)
  const monthlyBookingSeries = buildMonthlySeries(monthlyStatistics?.monthlyBookings)
  const rideBookingMonths = Array.from(
    new Set([...monthlyRideSeries, ...monthlyBookingSeries].map((item) => item.month)),
  )

  // Payment monthly earnings & platform fees (for line chart)
  const monthlyEarningsSeries = buildMonthlySeries(monthlyPaymentStatistics?.monthlyEarnings)
  const monthlyFeesSeries = buildMonthlySeries(monthlyPaymentStatistics?.monthlyPlatformFees)
  const paymentMonths = Array.from(
    new Set([...monthlyEarningsSeries, ...monthlyFeesSeries].map((item) => item.month)),
  )

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Admin Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            Refresh All
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setCreateAdminDialogOpen(true)}
          >
            Create Admin
          </Button>
          <IconButton
            color="error"
            size="small"
            onClick={handleLogout}
            title="Logout"
            sx={{
              border: '1px solid',
              borderColor: 'error.main',
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
              },
            }}
          >
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Users', value: userStats.total, index: 0 },
          { label: 'Total Rides', value: rideStatistics?.totalRides || 0, index: 1 },
          { label: 'Total Bookings', value: rideStatistics?.totalBookings || 0, index: 2 },
          {
            label: 'Total Earnings',
            value: `₹${paymentStatistics?.totalEarnings?.toFixed(2) || '0.00'}`,
            color: 'success.main',
            index: 3,
          },
          { label: 'Active Users', value: userStats.active, color: 'success.main', index: 4 },
          { label: 'Cancelled Rides', value: rideStatistics?.cancelledRides || 0, color: 'error.main', index: 5 },
          {
            label: 'Successful Payments',
            value: paymentStatistics?.successfulPayments || 0,
            color: 'success.main',
            index: 6,
          },
          {
            label: 'Platform Fees',
            value: `₹${paymentStatistics?.totalPlatformFees?.toFixed(2) || '0.00'}`,
            index: 7,
          },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `fadeInUp 0.6s ease-out ${stat.index * 0.1}s both`,
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 8px 24px rgba(15, 139, 141, 0.15)',
                },
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(30px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h4" color={stat.color || 'inherit'}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Users" icon={<PersonAddIcon />} iconPosition="start" />
            <Tab label="Rides" icon={<DirectionsCarIcon />} iconPosition="start" />
            <Tab label="Bookings" icon={<BookOnlineIcon />} iconPosition="start" />
            <Tab label="Payments" icon={<PaymentIcon />} iconPosition="start" />
            <Tab label="Reports" icon={<AssessmentIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Users Tab */}
          {tabValue === 0 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  All Users
                </Typography>
                {error && (
                  <Typography variant="body2" color="error" sx={{ ml: 2 }}>
                    Error: {error}
                  </Typography>
                )}
              </Box>
              {loading ? (
                <Box display="flex" flexDirection="column" alignItems="center" p={3}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading users...
                  </Typography>
                </Box>
              ) : error ? (
                <Box p={3} textAlign="center">
                  <Typography variant="body1" color="error" gutterBottom>
                    Failed to load users
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {error}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => dispatch(fetchAllUsers())}
                    sx={{ mt: 2 }}
                  >
                    Retry
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Email Verified</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.role}
                                size="small"
                                color={user.role === 'ADMIN' ? 'error' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.status}
                                size="small"
                                color={user.status === 'ACTIVE' ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              {user.emailVerified ? (
                                <CheckCircleIcon color="success" fontSize="small" />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.status === 'BLOCKED' ? (
                                <IconButton
                                  color="success"
                                  size="small"
                                  onClick={() => handleUnblockUser(user.id)}
                                  title="Unblock User"
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              ) : (
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleBlockUser(user.id)}
                                  title="Block User"
                                  disabled={user.role === 'ADMIN'}
                                >
                                  <BlockIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No users found
                            </Typography>
                            {!loading && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => dispatch(fetchAllUsers())}
                                sx={{ mt: 2 }}
                              >
                                Refresh
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Rides Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                All Rides
              </Typography>
              {loadingRides ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Seats</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rides && rides.length > 0 ? (
                        rides.map((ride) => (
                          <TableRow key={ride.id}>
                            <TableCell>{ride.id}</TableCell>
                            <TableCell>{ride.driverName || `Driver ${ride.driverId}`}</TableCell>
                            <TableCell>{ride.source}</TableCell>
                            <TableCell>{ride.destination}</TableCell>
                            <TableCell>{dayjs(ride.rideDate).format('DD/MM/YYYY')}</TableCell>
                            <TableCell>{ride.rideTime}</TableCell>
                            <TableCell>
                              {ride.availableSeats}/{ride.totalSeats}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={ride.status}
                                size="small"
                                color={
                                  ride.status === 'COMPLETED'
                                    ? 'success'
                                    : ride.status === 'CANCELLED'
                                      ? 'error'
                                      : 'default'
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              {loadingRides ? 'Loading rides...' : 'No rides found'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Bookings Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                All Bookings
              </Typography>
              {loadingBookings ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Ride ID</TableCell>
                        <TableCell>Passenger ID</TableCell>
                        <TableCell>Seats</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Fare</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>{booking.id}</TableCell>
                          <TableCell>{booking.rideId}</TableCell>
                          <TableCell>{booking.passengerId}</TableCell>
                          <TableCell>{booking.seatsBooked}</TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              size="small"
                              color={
                                booking.status === 'CONFIRMED'
                                  ? 'success'
                                  : booking.status === 'CANCELLED'
                                    ? 'error'
                                    : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>₹{booking.passengerFare?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            {booking.createdAt
                              ? dayjs(booking.createdAt).format('DD/MM/YYYY HH:mm')
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Payments Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                All Payments
              </Typography>
              {loadingPayments ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Booking ID</TableCell>
                        <TableCell>Passenger ID</TableCell>
                        <TableCell>Driver ID</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Fare</TableCell>
                        <TableCell>Platform Fee</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.id}</TableCell>
                          <TableCell>{payment.bookingId}</TableCell>
                          <TableCell>{payment.passengerId}</TableCell>
                          <TableCell>{payment.driverId}</TableCell>
                          <TableCell>₹{payment.amount?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>₹{payment.fare?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>₹{payment.platformFee?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status}
                              size="small"
                              color={
                                payment.status === 'SUCCESS'
                                  ? 'success'
                                  : payment.status === 'FAILED'
                                    ? 'error'
                                    : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {payment.createdAt ? dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Reports Tab */}
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom mb={3}>
                System Reports
              </Typography>
              {loadingStatistics ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
              <Grid container spacing={3}>
                {/* Summary cards */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Ride Statistics
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography>Total Rides: {rideStatistics?.totalRides || 0}</Typography>
                        <Typography>Active Rides: {rideStatistics?.activeRides || 0}</Typography>
                        <Typography>Completed Rides: {rideStatistics?.completedRides || 0}</Typography>
                        <Typography color="error">
                          Cancelled Rides: {rideStatistics?.cancelledRides || 0}
                        </Typography>
                        <Typography>Total Bookings: {rideStatistics?.totalBookings || 0}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Payment Statistics
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography>Total Payments: {paymentStatistics?.totalPayments || 0}</Typography>
                        <Typography color="success.main">
                          Successful: {paymentStatistics?.successfulPayments || 0}
                        </Typography>
                        <Typography color="warning.main">
                          Pending: {paymentStatistics?.pendingPayments || 0}
                        </Typography>
                        <Typography color="error">
                          Failed: {paymentStatistics?.failedPayments || 0}
                        </Typography>
                        <Typography variant="h6" color="success.main" mt={2}>
                          Total Earnings: ₹{paymentStatistics?.totalEarnings?.toFixed(2) || '0.00'}
                        </Typography>
                        <Typography variant="h6">
                          Platform Fees: ₹{paymentStatistics?.totalPlatformFees?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* User stats card */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Statistics
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography>Total Users: {userStats.total}</Typography>
                        <Typography>Active Users: {userStats.active}</Typography>
                        <Typography color="error">Blocked Users: {userStats.blocked}</Typography>
                        <Typography>Admins: {userStats.admins}</Typography>
                        <Typography>Drivers: {userStats.drivers}</Typography>
                        <Typography>Passengers: {userStats.passengers}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Monthly rides & bookings bar chart */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monthly Rides & Bookings
                      </Typography>
                      {rideBookingMonths.length === 0 ? (
                        <Typography color="text.secondary">
                          No monthly ride data available yet.
                        </Typography>
                      ) : (
                        <BarChart
                          height={260}
                          xAxis={[
                            {
                              scaleType: 'band',
                              data: rideBookingMonths,
                              label: 'Month',
                            },
                          ]}
                          series={[
                            {
                              data: rideBookingMonths.map((m) =>
                                getValueForMonth(monthlyRideSeries, m),
                              ),
                              label: 'Rides',
                              color: '#0f8b8d',
                            },
                            {
                              data: rideBookingMonths.map((m) =>
                                getValueForMonth(monthlyBookingSeries, m),
                              ),
                              label: 'Bookings',
                              color: '#f39c12',
                            },
                          ]}
                          margin={{ left: 60, right: 20, top: 20, bottom: 50 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Monthly earnings & platform fees chart */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Monthly Earnings & Platform Fees
                      </Typography>
                      {paymentMonths.length === 0 ? (
                        <Typography color="text.secondary">
                          No monthly payment data available yet.
                        </Typography>
                      ) : (
                        <Box display="flex" flexDirection="column" gap={2}>
                          {/* High level summary so admin can read numbers without reading the chart */}
                          <Box display="flex" flexWrap="wrap" gap={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Total Driver Earnings
                              </Typography>
                              <Typography variant="h6" color="success.main">
                                ₹{paymentStatistics?.totalEarnings?.toFixed(2) || '0.00'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Total Platform Fees
                              </Typography>
                              <Typography variant="h6">
                                ₹{paymentStatistics?.totalPlatformFees?.toFixed(2) || '0.00'}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary">
                            Each month shows two bars: <strong>green</strong> for the money paid to
                            drivers and <strong>orange</strong> for the platform&apos;s commission.
                          </Typography>

                          <BarChart
                            height={260}
                            xAxis={[
                              {
                                scaleType: 'band',
                                data: paymentMonths,
                                label: 'Month',
                              },
                            ]}
                            yAxis={[
                              {
                                label: 'Amount (₹)',
                              },
                            ]}
                            series={[
                              {
                                data: paymentMonths.map((m) =>
                                  getValueForMonth(monthlyEarningsSeries, m),
                                ),
                                label: 'Driver Earnings (₹)',
                                color: '#2ecc71',
                              },
                              {
                                data: paymentMonths.map((m) =>
                                  getValueForMonth(monthlyFeesSeries, m),
                                ),
                                label: 'Platform Fees (₹)',
                                color: '#e67e22',
                              },
                            ]}
                            margin={{ left: 70, right: 20, top: 20, bottom: 50 }}
                            slotProps={{
                              legend: {
                                direction: 'row',
                                position: { vertical: 'top', horizontal: 'center' },
                              },
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog
        open={createAdminDialogOpen}
        onClose={() => setCreateAdminDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Admin User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText="Minimum 8 characters"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAdminDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAdmin}
            variant="contained"
            disabled={creatingAdmin || !formData.email || !formData.name || !formData.password}
          >
            {creatingAdmin ? 'Creating...' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminDashboardPage
