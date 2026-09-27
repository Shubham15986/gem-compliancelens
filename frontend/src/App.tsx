import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ScorecardPage from './pages/ScorecardPage';
import AuditTrailPage from './pages/AuditTrailPage';
import BidderSubmitPage from "./pages/BidderSubmitPage";
import RulesConfigPage from './pages/RulesConfigPage';
import GuidePage from './pages/GuidePage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import OfficerTendersPage from './pages/OfficerTendersPage';
import OfficerTenderDetailPage from './pages/OfficerTenderDetailPage';
import VendorTendersPage from './pages/VendorTendersPage';
import VendorApplicationsListPage from "./pages/VendorApplicationsListPage";
import VendorApplicationPage from './pages/VendorApplicationPage';
import NotificationsPage from "./pages/NotificationsPage";
import HowItWorksPage from './pages/HowItWorksPage';
import SIHCompliancePage from './pages/SIHCompliancePage';

// Protect routes based on role
function ProtectedRoute({ children, allowedRole }: { children: JSX.Element, allowedRole: string }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/guide`} replace />;
  }
  
  return children;
}

function AppContent() {
  const location = useLocation();
  const isStandalonePage = ['/', '/login', '/how-it-works', '/sih-compliance'].includes(location.pathname);

  return (
    <>
      {isStandalonePage ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HowItWorksPage />} />
          <Route path="/sih-compliance" element={<SIHCompliancePage />} />
          <Route path="/how-it-works" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            {/* Common / Redirects */}
            <Route path="/" element={<Navigate to="/" replace />} />
            
            {/* Officer Gateway */}
            <Route path="/officer/guide" element={<ProtectedRoute allowedRole="officer"><GuidePage /></ProtectedRoute>} />
            <Route path="/officer/tenders" element={<ProtectedRoute allowedRole="officer"><OfficerTendersPage /></ProtectedRoute>} />
            <Route path="/officer/tenders/:tenderId" element={<ProtectedRoute allowedRole="officer"><OfficerTenderDetailPage /></ProtectedRoute>} />
            <Route path="/officer/bids/:bidId/scorecard" element={<ProtectedRoute allowedRole="officer"><ScorecardPage /></ProtectedRoute>} />
            <Route path="/officer/bids/:bidId/audit" element={<ProtectedRoute allowedRole="officer"><AuditTrailPage /></ProtectedRoute>} />
            <Route path="/officer/rules" element={<ProtectedRoute allowedRole="officer"><RulesConfigPage /></ProtectedRoute>} />
            <Route path="/officer/notifications" element={<ProtectedRoute allowedRole="officer"><NotificationsPage /></ProtectedRoute>} />

            {/* Bidder Gateway */}
            <Route path="/bidder/guide" element={<ProtectedRoute allowedRole="bidder"><GuidePage /></ProtectedRoute>} />
            <Route path="/bidder/tenders" element={<ProtectedRoute allowedRole="bidder"><VendorTendersPage /></ProtectedRoute>} />
            <Route path="/bidder/applications/:appId" element={<ProtectedRoute allowedRole="bidder"><VendorApplicationPage /></ProtectedRoute>} />
            <Route path="/bidder/applications" element={<ProtectedRoute allowedRole="bidder"><VendorApplicationsListPage /></ProtectedRoute>} />
            <Route path="/bidder/submit" element={<ProtectedRoute allowedRole="bidder"><BidderSubmitPage /></ProtectedRoute>} />
            <Route path="/bidder/notifications" element={<ProtectedRoute allowedRole="bidder"><NotificationsPage /></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
