# Code Templates for UI Refactoring

## Home Page Template

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';

const Home = () => {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Master JEE & NEET with
              <span className="block text-accent mt-2">AI-Powered Tests</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Comprehensive test series platform with instant results and detailed analytics
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {!user ? (
                <>
                  <Link to="/demo-tests">
                    <Button variant="accent" size="lg">
                      Try Free Demo Tests
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
                  <Button variant="accent" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to ace your entrance exams
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card hover className="h-full">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Affordable pricing with full access to all features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`text-center ${
                    plan.popular ? 'ring-4 ring-primary shadow-2xl scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <span className="inline-block bg-accent text-gray-900 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-primary mb-4">
                    ₹{plan.price}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="text-left space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-purple-700 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container text-center"
        >
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students preparing for JEE & NEET
          </p>
          <Link to="/register">
            <Button variant="accent" size="lg">
              Sign Up Now - It's Free!
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: '📚',
    title: 'Comprehensive Question Bank',
    description: 'Access thousands of questions covering all subjects and chapters',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Test Generation',
    description: 'Generate custom tests based on subjects, chapters, and difficulty',
  },
  {
    icon: '📊',
    title: 'Detailed Analytics',
    description: 'Track your performance with comprehensive analytics and insights',
  },
  {
    icon: '💯',
    title: 'Instant Results',
    description: 'Get immediate feedback with detailed solutions and explanations',
  },
  {
    icon: '📱',
    title: 'Accessible Anywhere',
    description: 'Study on any device with our responsive platform',
  },
  {
    icon: '💰',
    title: 'Affordable Plans',
    description: 'Choose from flexible subscription plans starting at ₹299',
  },
];

const pricingPlans = [
  {
    name: 'JEE Main',
    price: '299',
    description: 'Perfect for JEE Main preparation',
    features: [
      'Unlimited Tests',
      'Physics, Chemistry, Mathematics',
      '30-day validity',
      'Detailed Analytics',
      'Performance Reports',
    ],
  },
  {
    name: 'JEE Main + Advanced',
    price: '399',
    description: 'Complete JEE preparation',
    popular: true,
    features: [
      'Everything in JEE Main',
      'Advanced Level Questions',
      '60-day validity',
      'Priority Support',
      'Study Materials',
    ],
  },
  {
    name: 'NEET',
    price: '399',
    description: 'Complete NEET preparation',
    features: [
      'Unlimited Tests',
      'Physics, Chemistry, Biology',
      '60-day validity',
      'Detailed Analytics',
      'Performance Reports',
    ],
  },
];

export default Home;
```

## Student Dashboard Template

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { StatCard, Card, ProgressBar, Button, LoadingSpinner } from '../../components/ui';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/results/user/analytics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's your performance overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tests"
            value={stats?.totalTests || 0}
            icon="📝"
            variant="default"
          />
          <StatCard
            title="Average Score"
            value={`${stats?.averageScore || 0}%`}
            icon="📊"
            variant="success"
            trend="up"
            trendValue="+5%"
          />
          <StatCard
            title="Tests Remaining"
            value="Unlimited"
            icon="🎯"
            variant="purple"
          />
          <StatCard
            title="Study Streak"
            value={`${stats?.streak || 0} days`}
            icon="🔥"
            variant="warning"
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/student/generate-test">
              <Button variant="primary" className="w-full">
                🚀 Generate New Test
              </Button>
            </Link>
            <Link to="/demo-tests">
              <Button variant="accent" className="w-full">
                🎯 Try Demo Tests
              </Button>
            </Link>
            <Link to="/student/results">
              <Button variant="outline" className="w-full">
                📊 View All Results
              </Button>
            </Link>
          </div>
        </Card>

        {/* Subject Performance */}
        <Card>
          <h2 className="text-2xl font-semibold mb-6">Subject-wise Performance</h2>
          <div className="space-y-6">
            {stats?.subjectPerformance?.map((subject, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{subject.name}</span>
                  <span className="text-sm text-gray-500">
                    {subject.testsAttempted} tests
                  </span>
                </div>
                <ProgressBar
                  value={subject.averageScore}
                  max={100}
                  variant={subject.averageScore >= 70 ? 'success' : 'warning'}
                />
              </motion.div>
            )) || (
              <p className="text-gray-500 text-center py-8">
                No performance data yet. Start taking tests!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
```

## Login Page Template

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';
import { toast } from 'react-toastify';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(phone, password);
      toast.success('Login successful!');
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-600 to-purple-700 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-white/95">
          <div className="text-center mb-8">
            <div className="inline-block bg-primary p-4 rounded-full mb-4">
              <span className="text-4xl">🎓</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Login to continue your learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
```

## Notes:
- Copy these templates and adapt them to your existing pages
- Import data from your existing components
- Keep all API calls and functionality intact
- Just update the UI/styling layer
- Test thoroughly after each page refactoring
