import { Routes, Route } from 'react-router-dom';
import ClientJoin from './pages/ClientJoin';
import ClientSuccess from './pages/ClientSuccess';
import ThankYou from './pages/ThankYou';
import PublicMonitoring from './pages/PublicMonitoring';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import StaffProfile from './pages/StaffProfile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ToastContainer from './components/Toast';

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
      {/* Public/Client Routes */}
      <Route path="/" element={<ClientJoin />} />
      <Route path="/success" element={<ClientSuccess />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/monitor" element={<PublicMonitoring />} />
      
      {/* Staff Routes */}
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/staff/profile" element={<StaffProfile />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
    </>
  );
}

export default App;
