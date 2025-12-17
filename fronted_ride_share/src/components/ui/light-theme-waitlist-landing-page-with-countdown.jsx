import React, { useState, useEffect, useRef } from 'react'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  QuadraticBezierCurve3,
  Vector3,
  TubeGeometry,
  ShaderMaterial,
  Mesh,
  AdditiveBlending,
  DoubleSide,
  Color,
  PlaneGeometry,
} from 'three'

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

const Button = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-10 px-4 py-2 ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = 'Button'

export function WaitlistExperience({ onSignUp, onLogin }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const animationIdRef = useRef(null)

  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeSection, setActiveSection] = useState('join-now')
  const [currentTime, setCurrentTime] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hours: new Date().getHours(),
    minutes: new Date().getMinutes(),
    seconds: new Date().getSeconds(),
  })

  const sectionsRef = useRef({
    'how-it-works': null,
    fares: null,
    'join-now': null,
    about: null,
    safety: null,
    support: null,
  })

  // Three.js background effect - Enhanced with more visible beams
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new Scene()
    sceneRef.current = scene

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    rendererRef.current = renderer

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0xf8fafc, 0) // Set alpha to 0 for transparency
    mountRef.current.appendChild(renderer.domElement)

    // Create multiple curved light geometries for a more pronounced effect
    const curves = [
      new QuadraticBezierCurve3(
        new Vector3(-15, -3, 0),
        new Vector3(0, 1, 0),
        new Vector3(12, -2, 0), // Reduced right side extension
      ),
      new QuadraticBezierCurve3(
        new Vector3(-14, -2, 0),
        new Vector3(1, 2, 0),
        new Vector3(10, -1, 0), // Reduced right side extension
      ),
      new QuadraticBezierCurve3(
        new Vector3(-16, -4, 0),
        new Vector3(-1, 0.5, 0),
        new Vector3(11, -3, 0), // Reduced right side extension
      ),
    ]

    // Create lighter and more subtle colors
    const colors = [
      new Color(0x88c1ff), // Very light blue
      new Color(0xa0d2ff), // Lighter blue
      new Color(0x78b6ff), // Soft blue
    ]

    // Create multiple light beams for a more pronounced effect
    curves.forEach((curve, index) => {
      // Create tube geometry for the light streak
      const tubeGeometry = new TubeGeometry(curve, 200, index === 0 ? 0.8 : 0.6, 32, false)

      // Create gradient material with lighter colors
      const vertexShader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `

      const fragmentShader = `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          // Base color with reduced intensity
          vec3 baseColor = color;
          
          // Add subtle pulsing effect
          float pulse = sin(time * 1.5) * 0.1 + 0.9;
          
          // Create gradient effect from left to right
          float gradient = smoothstep(0.0, 1.0, vUv.x);
          
          // Center glow effect
          float glow = 1.0 - abs(vUv.y - 0.5) * 2.0;
          glow = pow(glow, 2.0);
          
          // Fade at the ends - more pronounced on the right
          float fade = 1.0;
          if (vUv.x > 0.7) {
            fade = 1.0 - smoothstep(0.7, 1.0, vUv.x);
          } else if (vUv.x < 0.2) {
            fade = smoothstep(0.0, 0.2, vUv.x);
          }
          
          // Final color with reduced intensity
          vec3 finalColor = baseColor * gradient * pulse * glow * fade * 0.8;
          
          gl_FragColor = vec4(finalColor, glow * fade * 0.6);
        }
      `

      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          color: { value: colors[index] },
        },
        transparent: true,
        blending: AdditiveBlending,
        side: DoubleSide,
      })

      const lightStreak = new Mesh(tubeGeometry, material)
      lightStreak.rotation.z = index * 0.15
      scene.add(lightStreak)
    })

    // Add background gradient plane with reduced opacity
    const backgroundGeometry = new PlaneGeometry(80, 55) // Smaller size to avoid right edge
    const backgroundMaterial = new ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        
        void main() {
          // Create a very light blue gradient from left to right
          vec3 blue1 = vec3(0.7, 0.85, 1.0);
          vec3 blue2 = vec3(0.6, 0.8, 1.0);
          vec3 blue3 = vec3(0.5, 0.75, 0.95);
          
          // Animate the gradient slightly
          float timeFactor = sin(time * 0.2) * 0.05;
          
          // Create gradient effect
          vec3 color = mix(blue1, blue2, vUv.x + timeFactor);
          color = mix(color, blue3, vUv.x * 0.3 + timeFactor);
          
          // Add subtle noise for texture
          float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) * 0.05;
          
          // Add blur effect using smoothstep
          float blur = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
          
          gl_FragColor = vec4(color + noise, 0.15 * blur);
        }
      `,
      uniforms: {
        time: { value: 0 },
      },
      transparent: true,
      side: DoubleSide,
    })

    const background = new Mesh(backgroundGeometry, backgroundMaterial)
    background.position.z = -5
    background.position.x = -2 // Shift slightly left to avoid right edge
    scene.add(background)

    // Position camera slightly to the left to avoid showing the right edge
    camera.position.z = 7
    camera.position.y = -0.8
    camera.position.x = -1

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const time = Date.now() * 0.001

      // Update all materials with time
      scene.traverse((object) => {
        if (object instanceof Mesh && object.material instanceof ShaderMaterial) {
          if (object.material.uniforms.time) {
            object.material.uniforms.time.value = time
          }
        }
      })

      // Very subtle rotation for dynamic effect
      scene.children.forEach((child, index) => {
        if (child instanceof Mesh && index < curves.length) {
          child.rotation.z = Math.sin(time * 0.1 + index * 0.5) * 0.05
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return

      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }

      renderer.dispose()

      // Dispose of all geometries and materials
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose()
          if (object.material instanceof ShaderMaterial) {
            object.material.dispose()
          }
        }
      })
    }
  }, [])

  // Current time updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      })
    }

    updateTime() // Update immediately
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [])

  // Scroll detection for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200 // Offset for fixed nav

      for (const [sectionId, element] of Object.entries(sectionsRef.current)) {
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      if (onSignUp) {
        onSignUp(email)
      } else {
        console.log('Email submitted:', email)
      }
    }
  }

  const handleLoginClick = () => {
    if (onLogin) {
      onLogin()
    }
  }

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
    const element = sectionsRef.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const navigationItems = [
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'fares', label: 'Fares' },
    { id: 'join-now', label: 'Join Now' },
    { id: 'about', label: 'About' },
    { id: 'safety', label: 'Safety' },
    { id: 'support', label: 'Support' },
  ]

  return (
    <main className="relative w-full bg-slate-50 overflow-x-hidden">
      {/* Three.js Background */}
      <div ref={mountRef} className="fixed inset-0 w-full h-screen" style={{ zIndex: 0 }} />

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Top Navigation - Fixed */}
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-full px-6 py-3 shadow-lg">
            <div className="flex items-center gap-6">
              <button
                onClick={() => scrollToSection('join-now')}
                className="text-slate-800 font-medium hover:text-slate-600 transition-colors cursor-pointer"
              >
                SmartRide
              </button>
              <div className="flex items-center gap-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${
                      activeSection === item.id
                        ? 'bg-slate-800 text-white border border-slate-300'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Join Now Section */}
        <section
          ref={(el) => (sectionsRef.current['join-now'] = el)}
          id="join-now"
          className="flex items-center justify-center min-h-screen px-4 pt-24"
        >
          <div className="relative">
            <div className="relative backdrop-blur-xl bg-white/30 border border-slate-200/60 rounded-3xl p-8 w-[420px] shadow-2xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-50/80 to-transparent pointer-events-none" />

              <div className="relative z-10">
                {!isSubmitted ? (
                  <>
                    <div className="mb-8 text-center">
                      <h1 className="text-4xl font-light text-slate-800 mb-4 tracking-wide">
                        Join the waitlist
                      </h1>
                      <p className="text-slate-600 text-base leading-relaxed">
                        Get early access to SmartRide - the intelligent
                        <br />
                        ride-sharing platform built for modern travelers
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mb-6">
                      <div className="flex gap-3">
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="flex-1 bg-white/60 border-slate-300 text-slate-800 placeholder:text-slate-500 focus:border-slate-400 focus:ring-slate-300 h-12 rounded-xl backdrop-blur-sm"
                        />
                        <Button
                          type="submit"
                          className="h-12 px-6 bg-slate-500 hover:bg-slate-700 text-white font-medium cursor-pointer rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl shadow-blue-500/25"
                        >
                          Sign Up
                        </Button>
                      </div>
                    </form>

                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-700 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                          M
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                          B
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-700 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                          S
                        </div>
                      </div>
                      <span className="text-slate-600 text-sm">1000+ users are already using SmartRide</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 text-center mb-6">
                      <div>
                        <div className="text-2xl font-light text-slate-800">{currentTime.year}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">year</div>
                      </div>
                      <div className="text-slate-400">|</div>
                      <div>
                        <div className="text-2xl font-light text-slate-800">
                          {String(currentTime.month).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">month</div>
                      </div>
                      <div className="text-slate-400">|</div>
                      <div>
                        <div className="text-2xl font-light text-slate-800">
                          {String(currentTime.day).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">day</div>
                      </div>
                      <div className="text-slate-400">|</div>
                      <div>
                        <div className="text-2xl font-light text-slate-800">
                          {String(currentTime.hours).padStart(2, '0')}:
                          {String(currentTime.minutes).padStart(2, '0')}:
                          {String(currentTime.seconds).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-500 uppercase tracking-wide">time</div>
                      </div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                      <button
                        onClick={handleLoginClick}
                        className="text-sm text-slate-600 hover:text-slate-800 underline"
                      >
                        Already have an account? Login
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 flex items-center justify-center border border-emerald-300">
                      <svg
                        className="w-8 h-8 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">You're on the list!</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      We'll notify you when we launch. Thanks for joining!
                    </p>
                    <button
                      onClick={handleLoginClick}
                      className="text-sm text-slate-600 hover:text-slate-800 underline"
                    >
                      Continue to Login
                    </button>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
            </div>

            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-200/20 to-purple-200/20 blur-xl scale-110 -z-10" />
          </div>
        </section>

        {/* How It Works Section */}
        <section
          ref={(el) => (sectionsRef.current['how-it-works'] = el)}
          id="how-it-works"
          className="min-h-screen px-4 py-24 flex items-center justify-center"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-light text-slate-800 mb-12 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">🚗</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">1. Post a Ride</h3>
                <p className="text-slate-600">
                  Drivers can post their upcoming trips with source, destination, date, and available seats.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">2. Search & Book</h3>
                <p className="text-slate-600">
                  Passengers search for rides matching their route and book available seats instantly.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">3. Pay & Travel</h3>
                <p className="text-slate-600">
                  Secure payment processing with dynamic fare calculation based on distance traveled.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fares Section */}
        <section
          ref={(el) => (sectionsRef.current.fares = el)}
          id="fares"
          className="min-h-screen px-4 py-24 flex items-center justify-center bg-white/30"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-light text-slate-800 mb-8">Transparent Pricing</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">Dynamic Fare Calculation</h3>
                  <p className="text-slate-600 mb-4">
                    Our smart algorithm calculates fares based on the actual distance you travel, ensuring fair
                    pricing for everyone.
                  </p>
                  <ul className="text-left text-slate-600 space-y-2">
                    <li>✓ Base fare + distance-based pricing</li>
                    <li>✓ Split costs for multiple passengers</li>
                    <li>✓ No hidden charges</li>
                    <li>✓ Transparent breakdown</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">Platform Fees</h3>
                  <p className="text-slate-600 mb-4">
                    A small platform fee helps us maintain and improve the service for all users.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4 text-left">
                    <p className="text-slate-600">
                      <span className="font-semibold">Example:</span> For a ₹500 ride, platform fee is ₹50
                      (10%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          ref={(el) => (sectionsRef.current.about = el)}
          id="about"
          className="min-h-screen px-4 py-24 flex items-center justify-center"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-light text-slate-800 mb-8 text-center">About SmartRide</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
              <p className="text-slate-600 text-lg mb-6">
                SmartRide is a modern ride-sharing platform designed to connect drivers and passengers traveling
                in the same direction. We believe in making travel more affordable, sustainable, and social.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">Our Mission</h3>
                  <p className="text-slate-600">
                    To reduce the number of vehicles on the road while promoting shared mobility and creating
                    meaningful connections between travelers.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-3">Why Choose Us</h3>
                  <ul className="text-slate-600 space-y-2">
                    <li>• Route-based matching</li>
                    <li>• Secure payment system</li>
                    <li>• Verified drivers and vehicles</li>
                    <li>• Real-time updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section
          ref={(el) => (sectionsRef.current.safety = el)}
          id="safety"
          className="min-h-screen px-4 py-24 flex items-center justify-center bg-white/30"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-light text-slate-800 mb-12 text-center">Safety First</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Verified Users</h3>
                <p className="text-slate-600">
                  All drivers and passengers go through verification to ensure a safe community.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Rating System</h3>
                <p className="text-slate-600">
                  Rate your experience after each ride to help maintain quality and trust.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Secure Payments</h3>
                <p className="text-slate-600">
                  All transactions are processed securely through trusted payment gateways.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section
          ref={(el) => (sectionsRef.current.support = el)}
          id="support"
          className="min-h-screen px-4 py-24 flex items-center justify-center"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-light text-slate-800 mb-8">Need Help?</h2>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Contact Support</h3>
                  <p className="text-slate-600 mb-4">We're here to help you with any questions or concerns.</p>
                  <div className="space-y-2 text-slate-600">
                    <p>📧 support@smartride.com</p>
                    <p>📞 +1 (555) 123-4567</p>
                    <p>💬 Live chat available</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">FAQs</h3>
                  <div className="text-left space-y-3 text-slate-600">
                    <div>
                      <p className="font-semibold">How do I post a ride?</p>
                      <p className="text-sm">Register as a driver, add your vehicle, and post your trip details.</p>
                    </div>
                    <div>
                      <p className="font-semibold">How is fare calculated?</p>
                      <p className="text-sm">Fare is based on distance traveled using Google Maps distance calculation.</p>
                    </div>
                    <div>
                      <p className="font-semibold">Is my payment secure?</p>
                      <p className="text-sm">Yes, we use industry-standard encryption and secure payment gateways.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">SmartRide</h3>
                <p className="text-slate-300 text-sm">
                  The intelligent ride-sharing platform for modern travelers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>
                    <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">
                      How It Works
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('fares')} className="hover:text-white">
                      Fares
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('about')} className="hover:text-white">
                      About
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>
                    <button onClick={() => scrollToSection('support')} className="hover:text-white">
                      Contact Us
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('safety')} className="hover:text-white">
                      Safety
                    </button>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-slate-300 hover:text-white">
                    <span className="text-xl">📘</span>
                  </a>
                  <a href="#" className="text-slate-300 hover:text-white">
                    <span className="text-xl">🐦</span>
                  </a>
                  <a href="#" className="text-slate-300 hover:text-white">
                    <span className="text-xl">📷</span>
                  </a>
                  <a href="#" className="text-slate-300 hover:text-white">
                    <span className="text-xl">💼</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
              <p>© {new Date().getFullYear()} SmartRide. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

