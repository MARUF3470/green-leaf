import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSideBar from "@/components/app-sidebar";
import NavBar from "@/components/NavBar/NavBar";
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SidebarProvider>
        <AppSideBar />
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
