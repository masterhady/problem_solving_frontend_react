import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Activity, Code } from "lucide-react";
import { getAuthToken, API_BASE } from "@/lib/api";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProgressData {
  date: string;
  total_solved: number;
  total_solved_change: number;
  problem_solving_score: number;
  score_change: number;
  ranking: number;
  ranking_change: number;
  acceptance_rate: number;
  current_streak: number;
}

const EmployeeProgress = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => {
    if (!employeeId) {
      navigate("/company/employees");
      return;
    }
    fetchProgress();
  }, [employeeId, navigate]);

  const fetchProgress = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in");
      navigate("/Auth");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/company/employees/${employeeId}/progress/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      } else {
        toast.error("Failed to fetch progress data");
        navigate("/company/employees");
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to fetch progress data");
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

  if (!progressData) {
    return null;
  }

  const { employee, latest_stats, previous_stats, progress_timeline = [], growth_metrics } = progressData;

  const chartData = (progress_timeline || []).map((item: ProgressData) => ({
    date: new Date(item.date).toLocaleDateString(),
    total_solved: item.total_solved,
    score: item.problem_solving_score,
    ranking: item.ranking,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="company" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8">
            <Button variant="outline" onClick={() => navigate("/company/employees")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Button>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-primary" />
              {employee.name} - Progress Tracking
            </h1>
            <p className="text-muted-foreground">
              LeetCode Username: {employee.leetcode_username}
            </p>
          </div>

          {/* Latest vs Previous Comparison */}
          {latest_stats && previous_stats && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 gradient-card shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Total Problems Solved</h3>
                  {latest_stats.total_solved > previous_stats.total_solved && (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="text-3xl font-bold mb-2">{latest_stats.total_solved}</div>
                <div className="text-sm text-muted-foreground">
                  Previous: {previous_stats.total_solved} (
                  {latest_stats.total_solved - previous_stats.total_solved > 0 ? "+" : ""}
                  {latest_stats.total_solved - previous_stats.total_solved})
                </div>
              </Card>

              <Card className="p-6 gradient-card shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Problem Solving Score</h3>
                  {latest_stats.problem_solving_score > previous_stats.problem_solving_score && (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="text-3xl font-bold mb-2">{latest_stats.problem_solving_score}/100</div>
                <div className="text-sm text-muted-foreground">
                  Previous: {previous_stats.problem_solving_score} (
                  {latest_stats.problem_solving_score - previous_stats.problem_solving_score > 0 ? "+" : ""}
                  {latest_stats.problem_solving_score - previous_stats.problem_solving_score})
                </div>
              </Card>

              <Card className="p-6 gradient-card shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Growth Rate</h3>
                  <Code className="w-5 h-5 text-primary" />
                </div>
                {growth_metrics ? (
                  <>
                    <div className="text-2xl font-bold mb-2">
                      {growth_metrics.total_solved_growth_rate?.toFixed(1) || 0} problems/week
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Over {growth_metrics.period_days} days
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">Insufficient data</div>
                )}
              </Card>
            </div>
          )}

          {/* Progress Timeline Chart */}
          {progress_timeline && progress_timeline.length > 0 && (
            <Card className="p-6 gradient-card shadow-soft mb-8">
              <h2 className="text-2xl font-semibold mb-6">Progress Timeline</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_solved"
                    stroke="#8884d8"
                    name="Problems Solved"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="score"
                    stroke="#82ca9d"
                    name="Problem Solving Score"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Detailed Progress Table */}
          {progress_timeline && progress_timeline.length > 0 && (
            <Card className="p-6 gradient-card shadow-soft">
              <h2 className="text-2xl font-semibold mb-6">Detailed Progress History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Total Solved</th>
                      <th className="text-right p-2">Change</th>
                      <th className="text-right p-2">Score</th>
                      <th className="text-right p-2">Score Change</th>
                      <th className="text-right p-2">Ranking</th>
                      <th className="text-right p-2">Ranking Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(progress_timeline || []).slice().reverse().map((item: ProgressData, index: number) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="text-right p-2 font-semibold">{item.total_solved}</td>
                        <td className={`text-right p-2 ${item.total_solved_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.total_solved_change >= 0 ? "+" : ""}{item.total_solved_change}
                        </td>
                        <td className="text-right p-2 font-semibold">{item.problem_solving_score}</td>
                        <td className={`text-right p-2 ${item.score_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.score_change >= 0 ? "+" : ""}{item.score_change}
                        </td>
                        <td className="text-right p-2">{item.ranking.toLocaleString()}</td>
                        <td className={`text-right p-2 ${item.ranking_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.ranking_change >= 0 ? "+" : ""}{item.ranking_change}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {(!progress_timeline || progress_timeline.length === 0) && (
            <Card className="p-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No progress data available yet</p>
              <p className="text-sm text-muted-foreground">
                Sync this employee's profile to start tracking progress
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeProgress;

