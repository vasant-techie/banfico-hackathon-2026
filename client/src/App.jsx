import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { AccountDetail } from './pages/AccountDetail.jsx';
import { Insights } from './pages/Insights.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppShell } from './components/AppShell.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts/:accountId" element={<AccountDetail />} />
          <Route path="/insights" element={<Insights />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
