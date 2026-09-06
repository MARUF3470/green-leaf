import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import NavBar from "@/components/NavBar/NavBar";

import AdminSideBar from "@/components/AdminSideBar";
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SidebarProvider>
        <AdminSideBar />
        <main className="min-h-screen flex-1 transition-all duration-300 ease-in-out">
          <NavBar />
          <div className="p-4">
            <SidebarTrigger />
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default layout;
