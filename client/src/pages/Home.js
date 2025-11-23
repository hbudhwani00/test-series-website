import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import DemoTestSelectionModal from '../components/DemoTestSelectionModal';
import CallbackPopup from '../components/CallbackPopup';
import { API_URL } from '../services/api';
import './Home.css';
import './HomeModern.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCallbackPopup, setShowCallbackPopup] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState(null);

  useEffect(() => {
    if (user && user.role === 'student') {
      checkSubscription();
    }

    // Show callback popup for non-logged-in users
    if (!user) {
      // First popup after 5 seconds
      const firstTimer = setTimeout(() => {
        setShowCallbackPopup(true);
      }, 5000);

      // Subsequent popups every 10 seconds
      const intervalTimer = setInterval(() => {
        setShowCallbackPopup(true);
      }, 10000);

      return () => {
        clearTimeout(firstTimer);
        clearInterval(intervalTimer);
      };
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/payment/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const activeSubscriptions = response.data.subscriptions?.filter(
        sub => sub.isActive && new Date(sub.expiryDate) > new Date()
      );

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        setHasSubscription(true);
        // Get the first active subscription type
        setSubscriptionType(activeSubscriptions[0].examType);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleTryFreeTest = () => {
    if (user && user.role === 'student') {
      // User is logged in - check if they have subscription
      if (hasSubscription) {
        // Has subscription - go to dashboard
        navigate('/student/dashboard');
      } else {
        // No subscription - show demo modal to choose JEE/NEET
        setShowDemoModal(true);
      }
    } else {
      // Not logged in - show demo modal to choose JEE/NEET
      setShowDemoModal(true);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section with Cyan/Turquoise Background - World Class Design */}
      <section className="hero-section modern-hero">
        <div className="hero-background-modern">
          <div className="cyan-gradient"></div>
          <div className="floating-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
            <div className="circle circle-4"></div>
            <div className="circle circle-5"></div>
          </div>
        </div>
        
        <div className="hero-content-modern">
          <div className="hero-badge-modern">
            <span className="badge-icon">🚀</span>
            <span>India's #1 AI-Powered Test Platform</span>
          </div>
          
          <h1 className="hero-title-modern">
            Master Scores in <span className="highlight-text">JEE & NEET</span>
            <br />
            With AI-Powered Tests
          </h1>
          
          <p className="hero-subtitle-modern">
            Personalized tests that adapt to your weak areas.
            <br />
            Smart analytics. Real results. 🎯
          </p>

          <div className="hero-stats-modern">
            <div className="stat-item-modern">
              <div className="stat-number-modern">50,000+</div>
              <div className="stat-label-modern">Questions</div>
            </div>
            <div className="stat-item-modern">
              <div className="stat-number-modern">AI-Powered</div>
              <div className="stat-label-modern">Smart Analysis</div>
            </div>
            <div className="stat-item-modern">
              <div className="stat-number-modern">100%</div>
              <div className="stat-label-modern">Free First Test</div>
            </div>
          </div>

          <div className="hero-cta-modern">
            {!user ? (
              <>
                <button onClick={handleTryFreeTest} className="cta-button-modern cta-primary-modern">
                  <span>🎯 Try First Free Test</span>
                </button>
                <Link to="/register" className="cta-button-modern cta-secondary-modern">
                  <span>Get Started Free</span>
                </Link>
              </>
            ) : user.role === 'admin' ? (
              <Link to="/admin/dashboard" className="cta-button-modern cta-primary-modern">
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link to="/student/dashboard" className="cta-button-modern cta-primary-modern">
                <span>Go to Dashboard</span>
              </Link>
            )}
          </div>

          <div className="trust-badges-modern">
            
            <p className="cta-note">✓ No credit card required  •  ✓ Cancel anytime  •  ✓ 7-day guarantee</p>
          
          </div>
        </div>
      </section>

      {/* How It Works Section - World Class Design */}
      <section className="how-it-works-section-modern">
        <div className="container">
          <div className="section-header-modern">
            <span className="section-badge-modern">📚 Simple & Effective</span>
            <h2 className="section-title-modern">How It Works</h2>
            <p className="section-subtitle-modern">
              Get started in 3 easy steps and experience personalized learning
            </p>
          </div>

          <div className="how-it-works-grid-modern">
            {/* Step 1: AI Assessment */}
            <div className="work-step-card-modern">
              <div className="work-step-icon-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="gradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#gradientGreen)"
                    strokeWidth="4"
                    strokeDasharray="314"
                    strokeDashoffset="78.5"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="work-step-icon-inner">
                  <span className="work-icon">🔍</span>
                </div>
              </div>
              <h3 className="work-step-title-modern">AI Assessment</h3>
              <p className="work-step-desc-modern">
                Take an initial test and let our AI analyze your performance across all topics
              </p>
            </div>

            {/* Step 2: Personalized Plans */}
            <div className="work-step-card-modern">
              <div className="work-step-icon-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667EEA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#gradientBlue)"
                    strokeWidth="4"
                    strokeDasharray="314"
                    strokeDashoffset="78.5"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="work-step-icon-inner">
                  <span className="work-icon">🎯</span>
                </div>
              </div>
              <h3 className="work-step-title-modern">Personalized Plans</h3>
              <p className="work-step-desc-modern">
                Receive AI-generated study plans targeting your weak areas with customized practice tests
              </p>
            </div>

            {/* Step 3: Achieve Mastery */}
            <div className="work-step-card-modern">
              <div className="work-step-icon-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="gradientOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF8C42" />
                      <stop offset="100%" stopColor="#ff7620" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#gradientOrange)"
                    strokeWidth="4"
                    strokeDasharray="314"
                    strokeDashoffset="78.5"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="work-step-icon-inner">
                  <span className="work-icon">📈</span>
                </div>
              </div>
              <h3 className="work-step-title-modern">Achieve Mastery</h3>
              <p className="work-step-desc-modern">
                Track progress in real-time and watch your scores improve as you master each concept
              </p>
            </div>
          </div>

          <div className="how-it-works-cta-modern">
            <button onClick={handleTryFreeTest} className="cta-button-large">
              <span>Start Your Free Assessment</span>
              <span className="cta-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* AI-Powered USP Section */}
      <section className="ai-usp-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">🤖 Powered by AI</span>
            <h2 className="section-title">
              Why We're <span className="gradient-text">Different</span>
            </h2>
            <p className="section-subtitle">
              Traditional platforms give everyone the same tests. We're smarter.
            </p>
          </div>

          <div className="usp-grid">
            <div className="usp-card usp-highlight">
              <div className="usp-icon">🧠</div>
              <h3>AI Analyzes Your Weak Areas</h3>
              <p>Our AI studies your past performance and identifies topics where you score below 90%. No more wasting time on what you already know.</p>
              <div className="usp-feature-list">
                <span className="feature-tag">Smart Analysis</span>
                <span className="feature-tag">Topic-wise Tracking</span>
                <span className="feature-tag">90% Accuracy Threshold</span>
              </div>
            </div>

            <div className="usp-card">
              <div className="usp-icon">🎯</div>
              <h3>Personalized Question Selection</h3>
              <p>Get 2-3 questions from each weak topic. AI prioritizes questions you got wrong or left unattempted. Smart, not random.</p>
              <ul className="usp-benefits">
                <li>✓ Questions you got wrong (priority 1)</li>
                <li>✓ Questions you skipped (priority 2)</li>
                <li>✓ New questions from weak topics</li>
              </ul>
            </div>

            <div className="usp-card">
              <div className="usp-icon">📈</div>
              <h3>Adaptive Difficulty</h3>
              <p>Questions arranged from Easy → Medium → Hard. Build confidence while tackling challenging problems progressively.</p>
              <div className="difficulty-flow">
                <span className="diff-badge easy">Easy</span>
                <span className="arrow">→</span>
                <span className="diff-badge medium">Medium</span>
                <span className="arrow">→</span>
                <span className="diff-badge hard">Hard</span>
              </div>
            </div>
          </div>

          <div className="ai-demo-visual">
            <div className="demo-screen">
              <div className="demo-header">
                <div className="demo-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="demo-title">AI Test Generation</span>
              </div>
              <div className="demo-content">
                <div className="analysis-step">
                  <span className="step-icon">🔍</span>
                  <span className="step-text">Analyzing last 20 tests...</span>
                  <span className="step-status">✓</span>
                </div>
                <div className="analysis-step">
                  <span className="step-icon">📊</span>
                  <span className="step-text">Found 5 weak topics (&lt; 90%)</span>
                  <span className="step-status">✓</span>
                </div>
                <div className="analysis-step">
                  <span className="step-icon">🎯</span>
                  <span className="step-text">Selecting 20 personalized questions...</span>
                  <span className="step-status">✓</span>
                </div>
                <div className="analysis-step active">
                  <span className="step-icon">🤖</span>
                  <span className="step-text">Your AI test is ready!</span>
                  <span className="step-status pulse">●</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to <span className="gradient-text">Excel</span></h2>
          </div>

          <div className="features-showcase">
            <div className="feature-large">
              <div className="feature-visual">
                <div className="visual-card">
                  <div className="visual-header">
                    <span>📊</span>
                    <span>Performance Analytics</span>
                  </div>
                  <div className="visual-body">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '85%'}}></div>
                      <span>Physics - 85%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '92%'}}></div>
                      <span>Chemistry - 92%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill weak" style={{width: '67%'}}></div>
                      <span>Mathematics - 67% ⚠️</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-content">
                <h3>📊 Real-Time Analytics Dashboard</h3>
                <p>Track every metric that matters. Subject-wise accuracy, chapter-wise performance, weak topic identification, and progress over time.</p>
                <ul className="feature-list">
                  <li>✓ Topic-wise accuracy tracking</li>
                  <li>✓ Identify weak areas instantly</li>
                  <li>✓ Performance trends & graphs</li>
                  <li>✓ Compare with top performers</li>
                </ul>
              </div>
            </div>

            <div className="features-grid-small">
              <div className="feature-small">
                <div className="feature-icon">⚡</div>
                <h4>Instant Results</h4>
                <p>Get detailed solutions and explanations the moment you submit.</p>
              </div>
              <div className="feature-small">
                <div className="feature-icon">📱</div>
                <h4>Mobile Optimized</h4>
                <p>Study anywhere, anytime on any device. Fully responsive design.</p>
              </div>
              <div className="feature-small">
                <div className="feature-icon">🔒</div>
                <h4>Secure & Private</h4>
                <p>Your data is encrypted and secure. We value your privacy.</p>
              </div>
              <div className="feature-small">
                <div className="feature-icon">⏱️</div>
                <h4>Timed Tests</h4>
                <p>Real exam conditions with countdown timer and auto-submit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">💰 Affordable Excellence</span>
            <h2 className="section-title">Choose Your <span className="gradient-text">Success Plan</span></h2>
            <p className="section-subtitle">No hidden fees. Cancel anytime. 7-day money-back guarantee.</p>
            <p className="mobile-swipe-hint" style={{
              display: 'none',
              fontSize: '0.9rem',
              color: '#64748b',
              marginTop: '10px',
              fontStyle: 'italic'
            }}>
              👉 Swipe to see all plans →
            </p>
          </div>

          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>JEE Main</h3>
                <p className="pricing-desc">Perfect for JEE Main aspirants</p>
              </div>
              <div className="pricing-price">
                <span className="currency">₹</span>
                <span className="amount">299</span>
                <span className="period">/session</span>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> 15,000+ JEE Main Questions</li>
                <li><span className="check">✓</span> AI-Powered Personalized Tests</li>
                <li><span className="check">✓</span> Detailed Analytics Dashboard</li>
                <li><span className="check">✓</span> Subject & Chapter-wise Tests</li>
                <li><span className="check">✓</span> Instant Results & Solutions</li>
                <li><span className="check">✓</span> Mobile App Access</li>
              </ul>
              <Link to="/register" className="pricing-cta">Get Started</Link>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">🔥 Most Popular</div>
              <div className="pricing-header">
                <h3>JEE Main + Advanced</h3>
                <p className="pricing-desc">Complete JEE preparation</p>
              </div>
              <div className="pricing-price">
                <span className="currency">₹</span>
                <span className="amount">399</span>
                <span className="period">/session</span>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> Everything in JEE Main</li>
                <li><span className="check">✓</span> 20,000+ JEE Advanced Questions</li>
                <li><span className="check">✓</span> Advanced Level AI Analysis</li>
                <li><span className="check">✓</span> Previous Year Papers (10 years)</li>
                <li><span className="check">✓</span> Topic-wise Deep Dive</li>
                <li><span className="check">✓</span> Priority Support</li>
              </ul>
              <Link to="/register" className="pricing-cta">Get Started</Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>NEET</h3>
                <p className="pricing-desc">Complete NEET preparation</p>
              </div>
              <div className="pricing-price">
                <span className="currency">₹</span>
                <span className="amount">399</span>
                <span className="period">/session</span>
              </div>
              <ul className="pricing-features">
                <li><span className="check">✓</span> 25,000+ NEET Questions</li>
                <li><span className="check">✓</span> AI-Powered Personalized Tests</li>
                <li><span className="check">✓</span> Physics, Chemistry, Biology</li>
                <li><span className="check">✓</span> Detailed Analytics Dashboard</li>
                <li><span className="check">✓</span> NCERT Coverage & PYQs</li>
                <li><span className="check">✓</span> Mobile App Access</li>
              </ul>
              <Link to="/register" className="pricing-cta">Get Started</Link>
            </div>
          </div>

          <div className="pricing-guarantee">
            <span className="guarantee-icon">🛡️</span>
            <div className="guarantee-text">
              <strong>7-Day Money-Back Guarantee</strong>
              <p>Not satisfied? Get a full refund within 7 days. No questions asked.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta-section">
        <div className="cta-background">
          <div className="cta-gradient"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Preparation?</h2>
            <p>Join thousands of students who improved their scores with AI-powered learning</p>
            <div className="cta-buttons">
              <button onClick={handleTryFreeTest} className="cta-button cta-white">
                <span>🎯 Try Free Demo</span>
              </button>
              <Link to="/register" className="cta-button cta-outlined">
                <span>Start Free Trial</span>
                <span className="cta-arrow">→</span>
              </Link>
            </div>
            <p className="cta-note">✓ No credit card required  •  ✓ Cancel anytime  •  ✓ 7-day guarantee</p>
          </div>
        </div>
      </section>

      {/* Demo Test Selection Modal */}
      <DemoTestSelectionModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />

      {/* Callback Popup for non-logged-in users */}
      {showCallbackPopup && (
        <CallbackPopup onClose={() => setShowCallbackPopup(false)} />
      )}
    </div>
  );
};

export default Home;
