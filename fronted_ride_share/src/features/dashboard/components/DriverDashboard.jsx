import PropTypes from 'prop-types'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

import StatCard from '../../../components/common/StatCard'
import EmptyState from '../../../components/common/EmptyState'
import WalletCard from '../../../components/payments/WalletCard'

const formatDate = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const DriverDashboard = ({ rides, bookings, loading, userId }) => {
  const totalRides = rides.length
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length
  const completedRides = rides.filter((ride) => ride.status === 'COMPLETED').length
  const earnings = bookings.filter((b) => b.status === 'CONFIRMED').length * 250 // Mock earnings
  const rating = 4.8 // Mock rating

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <StatCard
          label="Total Rides"
          value={totalRides}
          icon={<TimelineRoundedIcon />}
          index={0}
          chip={
            <Chip
              label={`${completedRides} completed`}
              color="success"
              size="small"
              sx={{ width: 'fit-content' }}
            />
          }
        />
        <StatCard
          label="Active Bookings"
          value={activeBookings}
          icon={<EventSeatRoundedIcon />}
          index={1}
          chip={
            <Chip
              label={`${bookings.length} total`}
              color="primary"
              size="small"
              sx={{ width: 'fit-content' }}
            />
          }
        />
        <StatCard
          label="Earnings"
          value={`₹${earnings.toLocaleString()}`}
          icon={<CheckCircleRoundedIcon />}
          index={2}
          chip={<Chip label="This month" size="small" color="success" />}
        />
        <StatCard
          label="Rating"
          value={rating.toFixed(1)}
          icon={<CheckCircleRoundedIcon />}
          index={3}
          chip={<Chip label={`${completedRides} reviews`} size="small" />}
        />
      </Stack>

      {/* Wallet Card for Drivers */}
      {userId && (
        <Box sx={{ mb: 3 }}>
          <WalletCard userId={userId} />
        </Box>
      )}

      <Card
        sx={{
          mb: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'fadeInUp 0.6s ease-out 0.5s both',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          '@keyframes fadeInUp': {
            from: {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Recent Rides</Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor seat availability and ride status
              </Typography>
            </Box>
          </Stack>

          {rides.length === 0 && !loading ? (
            <EmptyState
              title="No rides posted yet"
              description="Post your first ride to start receiving booking requests."
              icon="🚗"
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Available Seats</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rides.map((ride) => (
                    <TableRow key={ride.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {ride.source} → {ride.destination}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ride.vehicle?.model ?? 'Vehicle TBD'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(ride.date)}</TableCell>
                      <TableCell>{ride.availableSeats ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={ride.status ?? 'POSTED'}
                          color={
                            ride.status === 'COMPLETED'
                              ? 'success'
                              : ride.status === 'CANCELLED'
                              ? 'error'
                              : 'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card
        sx={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: 'fadeInUp 0.6s ease-out 0.6s both',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
          '@keyframes fadeInUp': {
            from: {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Upcoming Rides</Typography>
              <Typography variant="body2" color="text.secondary">
                Rides scheduled for the next few days
              </Typography>
            </Box>
          </Stack>

          {rides.filter((ride) => ride.status === 'POSTED' || ride.status === 'CONFIRMED').length === 0 && !loading ? (
            <EmptyState
              title="No upcoming rides"
              description="Post a new ride to get started."
              icon="📅"
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Available Seats</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rides
                    .filter((ride) => ride.status === 'POSTED' || ride.status === 'CONFIRMED')
                    .slice(0, 5)
                    .map((ride) => (
                      <TableRow key={ride.id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {ride.source} → {ride.destination}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ride.vehicle?.model ?? 'Vehicle TBD'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(ride.date)}</TableCell>
                        <TableCell>{ride.availableSeats ?? 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={ride.status ?? 'POSTED'}
                            color={
                              ride.status === 'COMPLETED'
                                ? 'success'
                                : ride.status === 'CANCELLED'
                                ? 'error'
                                : 'primary'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  )
}

DriverDashboard.propTypes = {
  rides: PropTypes.arrayOf(PropTypes.shape({})),
  bookings: PropTypes.arrayOf(PropTypes.shape({})),
  loading: PropTypes.bool,
}

DriverDashboard.defaultProps = {
  rides: [],
  bookings: [],
  loading: false,
}

export default DriverDashboard

