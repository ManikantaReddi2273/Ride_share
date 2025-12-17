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
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'

import StatCard from '../../../components/common/StatCard'
import EmptyState from '../../../components/common/EmptyState'

const formatDate = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString()
}

const PassengerDashboard = ({ bookings }) => {
  const upcoming = bookings.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'PENDING')
  const totalBookings = bookings.length
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length
  const totalSpent = bookings.filter((b) => b.status === 'CONFIRMED').length * 150 // Mock spending
  const rating = 4.5 // Mock rating

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <StatCard
          label="Total Rides"
          value={totalBookings}
          icon={<ScheduleRoundedIcon />}
          index={0}
          chip={<Chip label={`${completedBookings} completed`} color="success" size="small" />}
        />
        <StatCard
          label="Active Bookings"
          value={upcoming.length}
          icon={<FavoriteRoundedIcon />}
          index={1}
          chip={<Chip label="Upcoming" size="small" color="primary" />}
        />
        <StatCard
          label="Total Spent"
          value={`₹${totalSpent.toLocaleString()}`}
          icon={<DirectionsCarFilledRoundedIcon />}
          index={2}
          chip={<Chip label="This month" size="small" color="info" />}
        />
        <StatCard
          label="Rating"
          value={rating.toFixed(1)}
          icon={<FavoriteRoundedIcon />}
          index={3}
          chip={<Chip label={`${completedBookings} reviews`} size="small" />}
        />
      </Stack>

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
              <Typography variant="h6" fontWeight={700}>Recent Bookings</Typography>
              <Typography variant="body2" color="text.secondary">
                Track confirmations and ride reminders
              </Typography>
            </Box>
          </Stack>

          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Search for rides that match your route to get started."
              icon="🧭"
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {booking.ride?.source} → {booking.ride?.destination}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {booking.ride?.driver?.name ?? booking.driverName ?? 'Pending'}
                      </TableCell>
                      <TableCell>{formatDate(booking.ride?.date ?? booking.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status ?? 'PENDING'}
                          color={
                            booking.status === 'CONFIRMED'
                              ? 'success'
                              : booking.status === 'CANCELLED'
                              ? 'error'
                              : 'default'
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
                Your confirmed rides for the next few days
              </Typography>
            </Box>
          </Stack>

          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming rides"
              description="Search for rides to book your next trip."
              icon="🚗"
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcoming.slice(0, 5).map((booking) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {booking.ride?.source} → {booking.ride?.destination}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {booking.ride?.driver?.name ?? booking.driverName ?? 'Pending'}
                      </TableCell>
                      <TableCell>{formatDate(booking.ride?.date ?? booking.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status ?? 'PENDING'}
                          color={
                            booking.status === 'CONFIRMED'
                              ? 'success'
                              : booking.status === 'CANCELLED'
                              ? 'error'
                              : 'default'
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

PassengerDashboard.propTypes = {
  bookings: PropTypes.arrayOf(PropTypes.shape({})),
}

PassengerDashboard.defaultProps = {
  bookings: [],
}

export default PassengerDashboard

