import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TopBanner from './components/TopBanner';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import ExamSelection from './pages/student/ExamSelection';
import ExamPatternSelection from './pages/student/ExamPatternSelection';
import Subscription from './pages/student/Subscription';
import TestGeneration from './pages/student/TestGeneration';
import TakeTest from './pages/student/TakeTest';
import JEEMainTest from './pages/student/JEEMainTest';
import ScheduledTestPage from './pages/student/ScheduledTestPage';
import Results from './pages/student/Results';
import ResultDetail from './pages/student/ResultDetail';
import DemoResultDetail from './pages/student/DemoResultDetail';
import ScheduledResultDetail from './pages/student/ScheduledResultDetail';
import DemoTests from './pages/student/DemoTests';
import AITest from './pages/student/AITest';
import AITestTake from './pages/student/AITestTake';
import TestSeries from './pages/student/TestSeries';
import NEETTestPage from './pages/student/NEETTestPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageDemoTest from './pages/admin/ManageDemoTest';
import ManageNEETDemoTest from './pages/admin/ManageNEETDemoTest';
import ManageUsers from './pages/admin/ManageUsers';
import CallbackRequests from './pages/admin/CallbackRequests';
import ManageScheduledTest from './pages/admin/ManageScheduledTest';
import UploadQuestions from './pages/admin/UploadQuestions';
import UploadQuestion from './pages/admin/UploadQuestion';
import ManageQuestions from './pages/admin/ManageQuestions';
import ViewStudents from './pages/admin/ViewStudents';
import ManageSubscriptions from './pages/admin/ManageSubscriptions';
import ScheduleTests from './pages/admin/ScheduleTests';
import PaymentApproval from './pages/admin/PaymentApproval';
import PromoCodeManagement from './pages/admin/PromoCodeManagement';
import StudentAnalytics from './pages/admin/StudentAnalytics';
import DemoLeads from './pages/admin/DemoLeads';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/student/dashboard" />;
  }

  if (!adminOnly && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  const location = useLocation();
  
  // Hide Navbar and Footer on test routes
  const isTestRoute = location.pathname.includes('/take-test') || 
                      location.pathname.includes('/jee-main-test') ||
                      location.pathname.includes('/demo-test') ||
                      location.pathname.includes('/neet-demo-test');
  
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isTestRoute && <Navbar />}
      {/* {!isTestRoute && <TopBanner />} */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo-tests" element={<ExamPatternSelection />} />
          <Route path="/student/take-test/:testId" element={<TakeTest />} />
          <Route path="/student/jee-main-test/:testId" element={<JEEMainTest />} />
          <Route path="/student/demo-test/:testId" element={<JEEMainTest />} />
          <Route path="/student/neet-demo-test/:testId" element={<NEETTestPage />} />
          <Route path="/student/scheduled-test/:testId" element={<ScheduledTestPage />} />
          <Route path="/student/demo-result/:resultId" element={<DemoResultDetail />} />
          <Route path="/student/scheduled-result/:resultId" element={<ScheduledResultDetail />} />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam-selection"
          element={
            <ProtectedRoute>
              <ExamSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam-patterns"
          element={
            <ProtectedRoute>
              <ExamPatternSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/subscription"
          element={
            <ProtectedRoute>
              <Subscription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/generate-test"
          element={
            <ProtectedRoute>
              <TestGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/jee-main-test/:testId"
          element={
            <ProtectedRoute>
              <JEEMainTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/result/:resultId"
          element={
            <ProtectedRoute>
              <ResultDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ai-test"
          element={
            <ProtectedRoute>
              <AITest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ai-test-take"
          element={
            <ProtectedRoute>
              <AITestTake />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/test-series"
          element={
            <ProtectedRoute>
              <TestSeries />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/callback-requests"
          element={
            <ProtectedRoute adminOnly={true}>
              <CallbackRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/demo-test"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageDemoTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/neet-demo-test"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageNEETDemoTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/upload-questions"
          element={
            <ProtectedRoute adminOnly={true}>
              <UploadQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-questions"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute adminOnly={true}>
              <ViewStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageSubscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedule-tests"
          element={
            <ProtectedRoute adminOnly={true}>
              <ScheduleTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-scheduled-tests"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageScheduledTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payment-approval"
          element={
            <ProtectedRoute adminOnly={true}>
              <PaymentApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/promo-codes"
          element={
            <ProtectedRoute adminOnly={true}>
              <PromoCodeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/student-analytics"
          element={
            <ProtectedRoute adminOnly={true}>
              <StudentAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/demo-leads"
          element={
            <ProtectedRoute adminOnly={true}>
              <DemoLeads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/upload-question"
          element={
            <ProtectedRoute adminOnly={true}>
              <UploadQuestion />
            </ProtectedRoute>
          }
        />
      </Routes>
      </main>
      {!isTestRoute && <Footer />}
      <ToastContainer position="top-right" autoClose={3000} />
      </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
