import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Rating,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import { useDispatch, useSelector } from 'react-redux'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'

import PageContainer from '../../components/common/PageContainer'
import EmptyState from '../../components/common/EmptyState'
import { apiClient } from '../../api/apiClient'
import endpoints from '../../api/endpoints'

const ReviewsPage = () => {
  const dispatch = useDispatch()
  const { enqueueSnackbar } = useSnackbar()
  const { user } = useSelector((state) => state.auth)
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reviewsReceived, setReviewsReceived] = useState([])
  const [reviewsGiven, setReviewsGiven] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    fetchReviews()
    fetchUserRating()
  }, [user])

  const fetchReviews = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)
    try {
      // Fetch reviews received (reviews about this user)
      const receivedResponse = await apiClient.get(endpoints.reviews.user(user.id))
      const receivedData = Array.isArray(receivedResponse.data) 
        ? receivedResponse.data 
        : receivedResponse.data?.reviews || []
      setReviewsReceived(receivedData)

      // Fetch reviews given (reviews this user wrote)
      // Note: This might need a different endpoint or we filter from bookings
      // For now, we'll show reviews received and allow filtering
      setReviewsGiven([]) // Will be populated if endpoint exists
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError(err.response?.data?.message || 'Failed to load reviews')
      enqueueSnackbar('Failed to load reviews', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRating = async () => {
    if (!user?.id) return

    try {
      const response = await apiClient.get(endpoints.reviews.userRating(user.id))
      const data = response.data
      setAverageRating(data.averageRating || 0)
      setTotalReviews(data.totalReviews || 0)
    } catch (err) {
      console.error('Error fetching user rating:', err)
    }
  }

  const handleRefresh = () => {
    fetchReviews()
    fetchUserRating()
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return dayjs(dateString).format('MMM DD, YYYY')
  }

  return (
    <PageContainer>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Reviews & Ratings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your reviews and ratings
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshRoundedIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Rating Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h2" fontWeight={700} color="primary.main">
                  {averageRating.toFixed(1)}
                </Typography>
                <Rating value={averageRating} precision={0.1} readOnly size="large" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Your Rating Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'DRIVER'
                  ? 'These are reviews from passengers who have traveled with you. Maintain a high rating by providing safe and comfortable rides.'
                  : 'These are reviews from drivers about your behavior as a passenger. Be respectful and punctual to maintain a good rating.'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Reviews Received (${reviewsReceived.length})`} />
          <Tab label={`Reviews Given (${reviewsGiven.length})`} />
        </Tabs>
      </Paper>

      {/* Reviews Received Tab */}
      {tabValue === 0 && (
        <Box>
          {!loading && reviewsReceived.length === 0 ? (
            <Paper>
              <EmptyState
                title="No reviews yet"
                description={
                  user?.role === 'DRIVER'
                    ? "You haven't received any reviews from passengers yet. Complete rides to start receiving reviews."
                    : "You haven't received any reviews from drivers yet."
                }
                icon="⭐"
              />
            </Paper>
          ) : (
            <Stack spacing={2}>
              {reviewsReceived.map((review) => (
                <Paper key={review.id} sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" gap={2} flex={1}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {review.reviewerName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {review.reviewerName || 'Anonymous'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(review.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    {review.comment && (
                      <>
                        <Divider />
                        <Typography variant="body2" color="text.secondary">
                          {review.comment}
                        </Typography>
                      </>
                    )}
                    {review.rideId && (
                      <Chip
                        icon={<DirectionsCarRoundedIcon />}
                        label={`Ride #${review.rideId}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Reviews Given Tab */}
      {tabValue === 1 && (
        <Box>
          {!loading && reviewsGiven.length === 0 ? (
            <Paper>
              <EmptyState
                title="No reviews given yet"
                description="You haven't written any reviews yet. Complete rides and rate your experience with drivers."
                icon="✍️"
              />
            </Paper>
          ) : (
            <Stack spacing={2}>
              {reviewsGiven.map((review) => (
                <Paper key={review.id} sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" gap={2} flex={1}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonRoundedIcon />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {review.reviewedUserName || 'Driver'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(review.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    {review.comment && (
                      <>
                        <Divider />
                        <Typography variant="body2" color="text.secondary">
                          {review.comment}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </PageContainer>
  )
}

export default ReviewsPage

