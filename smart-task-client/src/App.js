import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import TodoList from './pages/TodoList';
import Pomodoro from './pages/Pomodoro';
import StudyPlanner from './pages/StudyPlanner';
import ResetPassword from './pages/ResetPassword';


const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
        <Route path="/todo" element={<PrivateRoute><TodoList /></PrivateRoute>} />
        <Route path="/pomodoro" element={<PrivateRoute><Pomodoro /></PrivateRoute>} />
        <Route path="/study-planner" element={<PrivateRoute><StudyPlanner /></PrivateRoute>} />
        <Route path="/study" element={<PrivateRoute><StudyPlanner /></PrivateRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

      </Routes>
    </BrowserRouter>
  );
}