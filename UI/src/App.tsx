import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import SideNav from './components/SideNav';
import StudentChat from './pages/StudentChat';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-cream-50">
        <SideNav />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<StudentChat />} />
            <Route path="/chat" element={<StudentChat />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
