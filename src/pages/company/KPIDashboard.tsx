import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, Trophy, Target, BarChart3, Award } from "lucide-react";
import { getAuthToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

const KPIDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<any>(null);
  const [days, setDays] = useState("30");

  useEffect(() => {
    const currentuser = JSON.parse(localStorage.getItem("currentuser") || "null");
    if (!currentuser || currentuser.role === "jobseeker") {
      navigate("/Auth");
      return;
    }
    fetchKPIData();
  }, [navigate, days]);

  const fetchKPIData = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in");
      navigate("/Auth");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/company/kpi-dashboard/?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setKpiData(data);
      } else {
        toast.error("Failed to fetch KPI data");
      }
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      toast.error("Failed to fetch KPI data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar type="company" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
      </div>
    );
  }

  if (!kpiData || !kpiData.overview || kpiData.employee_count === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar type="company" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No employees found</p>
              <Button onClick={() => navigate("/company/employees")} className="gradient-primary">
                Add Employees
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const { overview, team_metrics = [], top_performers = { top_solvers: [], top_scores: [], most_consistent: [] }, growth_analysis } = kpiData;

  const teamChartData = (team_metrics || []).map((team: any) => ({
    name: team.team,
    avg_solved: Math.round(team.avg_total_solved || 0),
    avg_score: Math.round(team.avg_score || 0),
  }));

  const pieData = (team_metrics || []).map((team: any) => ({
    name: team.team,
    value: team.employee_count || 0,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="company" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-primary" />
                KPI Dashboard
              </h1>
              <p className="text-muted-foreground">
                Problem-solving skills metrics and team performance
              </p>
            </div>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 gradient-card shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
              <h3 className="text-3xl font-bold">{overview?.total_employees || 0}</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {overview?.employees_with_data || 0} with data
              </p>
            </Card>

            <Card className="p-6 gradient-card shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Avg Problems Solved</p>
              <h3 className="text-3xl font-bold">{overview?.avg_total_solved || 0}</h3>
            </Card>

            <Card className="p-6 gradient-card shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Avg Problem Solving Score</p>
              <h3 className="text-3xl font-bold">{overview?.avg_problem_solving_score || 0}/100</h3>
            </Card>

            <Card className="p-6 gradient-card shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Avg Acceptance Rate</p>
              <h3 className="text-3xl font-bold">{overview?.avg_acceptance_rate || 0}%</h3>
            </Card>
          </div>

          {/* Team Comparison */}
          {team_metrics && team_metrics.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 gradient-card shadow-soft">
                <h2 className="text-2xl font-semibold mb-6">Team Performance Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_solved" fill="#8884d8" name="Avg Problems Solved" />
                    <Bar dataKey="avg_score" fill="#82ca9d" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 gradient-card shadow-soft">
                <h2 className="text-2xl font-semibold mb-6">Team Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Top Performers */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 gradient-card shadow-soft">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Solvers
              </h2>
              <div className="space-y-3">
                {(top_performers?.top_solvers || []).slice(0, 5).map((performer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        {performer.team && (
                          <p className="text-xs text-muted-foreground">{performer.team}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold">{performer.total_solved}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 gradient-card shadow-soft">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Highest Scores
              </h2>
              <div className="space-y-3">
                {(top_performers?.top_scores || []).slice(0, 5).map((performer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        {performer.team && (
                          <p className="text-xs text-muted-foreground">{performer.team}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold">{performer.score}/100</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 gradient-card shadow-soft">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Most Consistent
              </h2>
              <div className="space-y-3">
                {(top_performers?.most_consistent || []).slice(0, 5).map((performer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        {performer.team && (
                          <p className="text-xs text-muted-foreground">{performer.team}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold">{performer.streak} days</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Growth Analysis */}
          {growth_analysis && growth_analysis.avg_growth && (
            <Card className="p-6 gradient-card shadow-soft">
              <h2 className="text-2xl font-semibold mb-6">Growth Analysis</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Average Problems Solved Growth</p>
                  <div className="text-3xl font-bold text-green-600">
                    +{(growth_analysis.avg_growth.total_solved_growth || 0).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Over {days} days period
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Average Score Growth</p>
                  <div className="text-3xl font-bold text-green-600">
                    +{(growth_analysis.avg_growth.score_growth || 0).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Over {days} days period
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default KPIDashboard;

