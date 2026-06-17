import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Detection from './pages/Detection';
import Analysis from './pages/Analysis';
import ReuseRecycle from './pages/ReuseRecycle';
import RecyclingCenters from './pages/RecyclingCenters';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import EcoPoints from './pages/EcoPoints';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="detect" element={<Detection />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="reuse-recycle" element={<ReuseRecycle />} />
        <Route path="recycling-centers" element={<RecyclingCenters />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="history" element={<History />} />
          <Route path="points" element={<EcoPoints />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
