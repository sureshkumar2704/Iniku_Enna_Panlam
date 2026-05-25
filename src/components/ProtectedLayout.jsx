import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import AppBrand from './AppBrand';

export default function ProtectedLayout() {
  return (
    <div className="protected-layout">
      <header className="protected-header">
        <AppBrand compact />
        <div className="protected-layout__user">
        <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <Outlet />
    </div>
  );
}