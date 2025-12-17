import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, CircularProgress, Typography } from '@mui/material'

const AdminRoute = ({ children }) => {
  const { token, user, initializing } = useSelector((state) => state.auth)
  const location = useLocation()

  if (initializing) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#E8F8F5',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.role !== 'ADMIN') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: '#E8F8F5',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You do not have permission to access this page. Admin privileges required.
        </Typography>
      </Box>
    )
  }

  return children
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

export default AdminRoute

