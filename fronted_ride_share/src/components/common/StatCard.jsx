import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'

const StatCard = ({ label, value, chip, icon, index = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    // Intersection Observer for fade-in animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isVisible) {
      // Number counting animation
      const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value
      if (!isNaN(numericValue) && numericValue > 0) {
        const duration = 1500
        const steps = 60
        const increment = numericValue / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= numericValue) {
            setDisplayValue(numericValue)
            clearInterval(timer)
          } else {
            setDisplayValue(Math.floor(current))
          }
        }, duration / steps)
        return () => clearInterval(timer)
      } else {
        setDisplayValue(value)
      }
    }
  }, [isVisible, value])

  const finalValue = typeof value === 'string' && value.includes('₹')
    ? `₹${displayValue.toLocaleString()}`
    : typeof value === 'string' && !isNaN(parseFloat(value))
    ? displayValue.toFixed(1)
    : displayValue || value

  return (
    <Box
      ref={cardRef}
      sx={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 3,
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        animation: isVisible ? `fadeInUp 0.6s ease-out ${index * 0.1}s both` : 'none',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: '0 8px 24px rgba(15, 139, 141, 0.15)',
          '& .stat-icon': {
            transform: 'scale(1.1) rotate(5deg)',
            bgcolor: 'rgba(15, 139, 141, 0.2)',
          },
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
      {icon && (
        <Box
          className="stat-icon"
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(15, 139, 141, 0.1)',
            color: 'primary.main',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {icon}
        </Box>
      )}
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            transition: 'all 0.3s ease',
          }}
        >
          {finalValue}
        </Typography>
        {chip}
      </Stack>
    </Box>
  )
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  chip: PropTypes.node,
  icon: PropTypes.node,
  index: PropTypes.number,
}

StatCard.defaultProps = {
  chip: null,
  icon: null,
  index: 0,
}

export default StatCard

