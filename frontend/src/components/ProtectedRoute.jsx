import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ redirectPath = '/' }) {
  const { isAuthenticated, isHydrating } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectPath}
        replace
        state={{
          authPrompt: true,
          authMode: 'choice',
          redirectTo: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return <Outlet />;
}
