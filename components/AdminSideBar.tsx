import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  ChartNoAxesColumn,
  Check,
  Handshake,
  IdCardLanyard,
} from "lucide-react";

import Link from "next/link";

const AdminSideBar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1>Admin Name</h1>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton />}>
                Select Workspace
                <ChevronDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}

            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/admin"
              >
                <Handshake /> Businesses
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/admin/revenue"
              >
                <ChartNoAxesColumn /> Revenue
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
};

export default AdminSideBar;
