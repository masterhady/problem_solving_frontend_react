import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileCheck, LayoutDashboard, Upload, Briefcase, Users, Settings, FileText, Target, LogOut, BrainIcon, TrendingUp, User2Icon, ClipboardList, FilePenLine, Code, BarChart3, Activity, Award } from "lucide-react";

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const SidebarItem = ({ to, icon, label, isActive }: SidebarItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth",
      isActive
        ? "bg-primary text-primary-foreground shadow-soft"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

interface DashboardSidebarProps {
  type: "company" | "seeker";
}

const DashboardSidebar = ({ type }: DashboardSidebarProps) => {
  const location = useLocation();

  const companyItems = [
    { to: "/company/employees", icon: <Users className="w-5 h-5" />, label: "Employee Management" },
    { to: "/company/leetcode-analysis", icon: <Code className="w-5 h-5" />, label: "LeetCode Analysis" },
    { to: "/company/leetcode-report", icon: <BarChart3 className="w-5 h-5" />, label: "LeetCode Report" },
    { to: "/company/kpi-dashboard", icon: <Activity className="w-5 h-5" />, label: "KPI Dashboard" },
    { to: "/company/goals", icon: <Award className="w-5 h-5" />, label: "Goals" },
    { to: "/company/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { to: "/company/glossary", icon: <FileText className="w-5 h-5" />, label: "Glossary" },
    { to: "/company/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
    { to: "/logout", icon: <LogOut className="w-5 h-5" />, label: "Logout" },
  ];

  const seekerItems = [
    { to: "/logout", icon: <LogOut className="w-5 h-5" />, label: "Logout" },
  ];

  const items = type === "company" ? companyItems : seekerItems;

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-16">
      <div className="p-6">
        <Link to="/" className="group">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-primary/25">
              <Code className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Problem Solver</h2>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {type === "company" ? "Company" : "Seeker"}
              </p>
            </div>
          </div>
        </Link>

        <nav className="space-y-2">
          {items.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
