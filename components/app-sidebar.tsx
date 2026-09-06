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
const AppSideBar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1>Business Name</h1>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton />}>
                Select Workspace
                <ChevronDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <span>Acme Inc</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/merchant/dashboard"
              >
                <LayoutDashboard /> Dashboard
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/merchant/tasks"
              >
                <Check /> Task
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/merchant/employees"
              >
                <IdCardLanyard /> Employees
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/merchant/analytics"
              >
                <ChartNoAxesColumn /> Analytics
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/merchant/notifications"
              >
                <BellRing /> Notifications
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/merchant/billing"
              >
                <Receipt /> Billing
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    </Sidebar>
  );
};

export default AppSideBar;
