import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SideNav from './components/SideNav';
import Dashboard from './pages/Dashboard';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-cream-50">
        <SideNav />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
