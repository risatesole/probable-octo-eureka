import type { ReactNode } from 'react';
import { redirect } from 'next/navigation'; 

import { AppSidebar } from '@/components/app-sidebar';
import { AdminTopbar } from '@/components/admin-topbar';
import UserService from '@/services/user';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // RSC (React Server Component): Ejecución directa en el servidor
  const userService = new UserService();
  const user = await userService.getCurrentUser();

  // Guard Clause: Protección estricta de la capa administrativa
  if (!user) {
    // Redirección a nivel de servidor (Next.js App Router) evita parpadeos en el cliente
    redirect('/login'); 
  }

  return (
    // Aplicación del Design System Institucional (UASD)
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans flex">
      <AppSidebar />
      
      {/* Sincronización geométrica: lg:pl-64 alinea con el w-64 (256px) del Sidebar */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-64">
        <AdminTopbar />
        
        <main className="flex-1 p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}