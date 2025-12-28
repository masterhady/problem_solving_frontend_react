import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Code, Users, TrendingUp, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthToken } from "@/lib/api";

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentuser = JSON.parse(localStorage.getItem("currentuser") || "{}");
    if (!currentuser?.id) {
      navigate("/auth");
      return;
    }
    setUser(currentuser);
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="company" />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.first_name || 'Company'}!</h1>
            <p className="text-muted-foreground">Manage your team's problem solving skills</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link to="/company/leetcode-analysis">
              <Card className="p-6 gradient-card shadow-soft hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Code className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">LeetCode Analysis</h3>
                    <p className="text-sm text-muted-foreground">Analyze profiles</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/company/employees">
              <Card className="p-6 gradient-card shadow-soft hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Employees</h3>
                    <p className="text-sm text-muted-foreground">Manage team members</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/company/kpi-dashboard">
              <Card className="p-6 gradient-card shadow-soft hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">KPI Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Track performance</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/company/goals">
              <Card className="p-6 gradient-card shadow-soft hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Target className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Goals</h3>
                    <p className="text-sm text-muted-foreground">Set objectives</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;
