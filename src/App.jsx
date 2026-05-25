import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import DayPage from './pages/DayPage';
import TodoPage from './pages/TodoPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/day/:dateKey" element={<DayPage />} />
        <Route path="/todos" element={<TodoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
