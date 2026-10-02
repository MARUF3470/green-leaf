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
  DollarSign,
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
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/employee"
              >
                <Check /> My Task
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/employee/earnings"
              >
                <DollarSign /> Earnings
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <Link
                className="flex justify-center items-center gap-1"
                href="/employee/profile"
              >
                <IdCardLanyard /> My Profile
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
