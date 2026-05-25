import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import AuthPage from './pages/AuthPage';
import CalendarPage from './pages/CalendarPage';
import DayPage from './pages/DayPage';
import TodoPage from './pages/TodoPage';
import ProtectedLayout from './components/ProtectedLayout';
import RequireAuth from './components/RequireAuth';

function SignInPage() {
  return <AuthPage mode="sign-in" />;
}

function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/sso-callback"
          element={
            <AuthenticateWithRedirectCallback
              signInFallbackRedirectUrl="/"
              signUpFallbackRedirectUrl="/"
              signInForceRedirectUrl="/"
              signUpForceRedirectUrl="/"
            />
          }
        />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/day/:dateKey" element={<DayPage />} />
            <Route path="/todos" element={<TodoPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
