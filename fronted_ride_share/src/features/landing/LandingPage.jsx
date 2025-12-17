import { useNavigate } from 'react-router-dom'
import { WaitlistExperience } from '@/components/ui/light-theme-waitlist-landing-page-with-countdown'

const LandingPage = () => {
  const navigate = useNavigate()

  const handleSignUp = (email) => {
    // Navigate to register page with email prefilled
    navigate('/register', {
      state: { email },
    })
  }

  const handleLogin = () => {
    // Navigate to login page
    navigate('/login')
  }

  return <WaitlistExperience onSignUp={handleSignUp} onLogin={handleLogin} />
}

export default LandingPage

