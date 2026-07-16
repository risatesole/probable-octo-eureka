import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { AdminTopbar } from '@/components/admin-topbar';
import UserService from '@/services/user';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const userService = new UserService();
  const user = await userService.getCurrentUser();


  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <AppSidebar />
      <div className="lg:pl-56">
        <AdminTopbar />
        <main className="p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
