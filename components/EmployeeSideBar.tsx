import React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BellRing,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  IdCardLanyard,
  LayoutDashboard,
  Receipt,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
const EmployeeSideBar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1>Employee Name</h1>
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
                href="/employee/mytasks"
              >
                <Check /> My Task
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/employee/earnings"
              >
                <IdCardLanyard /> Earnings
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/employee"
              >
                <ChartNoAxesColumn /> My Profile
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/employee/notifications"
              >
                <BellRing /> Notifications
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
};

export default EmployeeSideBar;
