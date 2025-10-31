import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-green-500 to-cyan-500 p-2.5 rounded-xl group-hover:scale-110 transition-all duration-300 shadow-lg">
              <span className="text-2xl">🎓</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">Test Series</span>
              <span className="text-xs text-gray-500 font-medium">JEE & NEET</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {!user ? (
              <>
                <Link
                  to="/demo-tests"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Try Demo
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Login
                </Link>
                <Link to="/register">
                  <button className="ml-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                    Get Started
                  </button>
                </Link>
              </>
            ) : user.role === 'admin' ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/upload-questions"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Upload
                </Link>
                <Link
                  to="/admin/manage-questions"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Questions
                </Link>
                <Link
                  to="/admin/students"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Students
                </Link>
                <Link
                  to="/admin/subscriptions"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Subscriptions
                </Link>
                <Link
                  to="/admin/payment-approval"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Payments
                </Link>
                <Link
                  to="/admin/promo-codes"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Promo Codes
                </Link>
                <button 
                  onClick={handleLogout}
                  className="ml-2 px-5 py-2 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-all duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/student/dashboard"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/student/exam-patterns"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Tests
                </Link>
                <Link
                  to="/student/results"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                >
                  Results
                </Link>
                <Link
                  to="/student/subscription"
                  className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 font-medium flex items-center gap-1"
                >
                  <span>💎</span> Subscription
                </Link>
                <button 
                  onClick={handleLogout}
                  className="ml-2 px-5 py-2 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-all duration-300"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 border-t border-gray-100 mt-4 pt-4"
            >
              <div className="flex flex-col space-y-1">
                {!user ? (
                  <>
                    <Link
                      to="/demo-tests"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Try Demo
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Register
                    </Link>
                  </>
                ) : user.role === 'admin' ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/upload-questions"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Upload Questions
                    </Link>
                    <Link
                      to="/admin/manage-questions"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Manage Questions
                    </Link>
                    <Link
                      to="/admin/students"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Students
                    </Link>
                    <Link
                      to="/admin/subscriptions"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Subscriptions
                    </Link>
                    <Link
                      to="/admin/payment-approval"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Payment Approval
                    </Link>
                    <Link
                      to="/admin/promo-codes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Promo Codes
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-3 rounded-lg border-2 border-purple-600 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all duration-300 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/student/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/student/exam-patterns"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Tests
                    </Link>
                    <Link
                      to="/student/results"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      My Results
                    </Link>
                    <Link
                      to="/student/subscription"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 font-medium"
                    >
                      Subscription
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-3 rounded-lg border-2 border-purple-600 text-purple-600 font-medium hover:bg-purple-600 hover:text-white transition-all duration-300 text-left"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
