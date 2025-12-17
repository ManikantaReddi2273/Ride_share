import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { AccountBalanceWallet, TrendingUp } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getWalletBalance, getWalletTransactions } from '../../features/payments/paymentSlice'

/**
 * Wallet Card Component
 * Displays user's wallet balance and recent transactions
 */
const WalletCard = ({ userId }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { walletBalance, walletTransactions, status, error } = useSelector(
    (state) => state.payments
  )

  useEffect(() => {
    if (userId) {
      dispatch(getWalletBalance(userId))
      dispatch(getWalletTransactions(userId))
    }
  }, [dispatch, userId])

  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(2) || '0.00'}`
  }

  if (status === 'loading' && !walletBalance) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error && !walletBalance) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'fadeInUp 0.6s ease-out 0.4s both',
        '&:hover': {
          transform: 'translateY(-4px)',
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
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet
              color="primary"
              sx={{
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.2) rotate(10deg)',
                },
              }}
            />
            <Typography variant="h6" fontWeight={600}>
              Wallet Balance
            </Typography>
          </Box>

          {walletBalance && (
            <>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Available Balance
                </Typography>
                <Typography variant="h4" color="primary" fontWeight={700}>
                  {formatCurrency(walletBalance.balance)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {walletBalance.currency || 'INR'}
                </Typography>
              </Box>

              {walletTransactions && walletTransactions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Recent Transactions
                  </Typography>
                  <Stack spacing={1}>
                    {walletTransactions.slice(0, 3).map((transaction, index) => (
                      <Box
                        key={transaction.id}
                        sx={{
                          p: 1.5,
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          animation: `slideInRight 0.5s ease-out ${0.5 + index * 0.1}s both`,
                          '&:hover': {
                            bgcolor: 'rgba(15, 139, 141, 0.08)',
                            transform: 'translateX(4px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          },
                          '@keyframes slideInRight': {
                            from: {
                              opacity: 0,
                              transform: 'translateX(-20px)',
                            },
                            to: {
                              opacity: 1,
                              transform: 'translateX(0)',
                            },
                          },
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {transaction.description || 'Transaction'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={
                            transaction.type === 'CREDIT' ? 'success.main' : 'error.main'
                          }
                        >
                          {transaction.type === 'CREDIT' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  // Navigate to payments page to view all transactions
                  navigate('/payments')
                }}
              >
                View All Transactions
              </Button>
            </>
          )}

          {!walletBalance && (
            <Alert severity="info">No wallet found. Wallet will be created on first transaction.</Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

WalletCard.propTypes = {
  userId: PropTypes.number.isRequired,
}

export default WalletCard
