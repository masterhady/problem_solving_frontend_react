import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  Users,
} from "lucide-react";
import { getAuthToken, API_BASE } from "@/lib/api";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: string;
  employee_id: string;
  employee_name: string;
  metric_type: string;
  metric_display: string;
  target_value: number;
  current_value: number;
  start_value: number;
  progress_percentage: number;
  is_achieved: boolean;
  target_date: string;
  achieved_at?: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  name: string;
}

const EmployeeGoals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    employee_id: "",
    metric_type: "total_solved",
    target_value: "",
    target_date: "",
    notes: "",
  });

  useEffect(() => {
    const currentuser = JSON.parse(localStorage.getItem("currentuser") || "null");
    if (!currentuser || currentuser.role === "jobseeker") {
      navigate("/Auth");
      return;
    }
    fetchEmployees();
    fetchGoals();
  }, [navigate, statusFilter]);

  const fetchEmployees = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/company/employees/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchGoals = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in");
      navigate("/Auth");
      return;
    }

    try {
      setLoading(true);
      const url = statusFilter !== "all"
        ? `${API_BASE}/company/goals/?status=${statusFilter}`
        : `${API_BASE}/company/goals/`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        toast.error("Failed to fetch goals");
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      const url = editingGoal
        ? `${API_BASE}/company/goals/${editingGoal.id}/`
        : `${API_BASE}/company/employees/${formData.employee_id}/goals/`;

      const method = editingGoal ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          target_value: parseFloat(formData.target_value),
          target_date: formData.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (response.ok) {
        toast.success(editingGoal ? "Goal updated successfully" : "Goal created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchGoals();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save goal");
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      employee_id: goal.employee_id,
      metric_type: goal.metric_type,
      target_value: goal.target_value.toString(),
      target_date: goal.target_date.split("T")[0],
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this goal?")) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/company/goals/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Goal deactivated");
        fetchGoals();
      } else {
        toast.error("Failed to deactivate goal");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to deactivate goal");
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      metric_type: "total_solved",
      target_value: "",
      target_date: "",
      notes: "",
    });
    setEditingGoal(null);
  };

  const metricOptions = [
    { value: "total_solved", label: "Total Problems Solved" },
    { value: "easy_solved", label: "Easy Problems Solved" },
    { value: "medium_solved", label: "Medium Problems Solved" },
    { value: "hard_solved", label: "Hard Problems Solved" },
    { value: "problem_solving_score", label: "Problem Solving Score" },
    { value: "acceptance_rate", label: "Acceptance Rate" },
    { value: "current_streak", label: "Current Streak" },
    { value: "ranking", label: "Ranking (lower is better)" },
  ];

  const getDaysRemaining = (targetDate: string) => {
    const days = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="company" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Target className="w-10 h-10 text-primary" />
                Employee Goals
              </h1>
              <p className="text-muted-foreground">
                Set and track goals for your team's problem-solving progress
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary" onClick={() => resetForm()}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingGoal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
                  <DialogDescription>
                    Set a goal for an employee to track their problem-solving progress
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="employee_id">Employee *</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                      required
                      disabled={!!editingGoal}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="metric_type">Metric *</Label>
                    <Select
                      value={formData.metric_type}
                      onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {metricOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target_value">Target Value *</Label>
                      <Input
                        id="target_value"
                        type="number"
                        value={formData.target_value}
                        onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="target_date">Target Date *</Label>
                      <Input
                        id="target_date"
                        type="date"
                        value={formData.target_date}
                        onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="gradient-primary">
                      {editingGoal ? "Update" : "Create"} Goal
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="achieved">Achieved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goals List */}
          {loading ? (
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading goals...</p>
            </Card>
          ) : goals.length === 0 ? (
            <Card className="p-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No goals found</p>
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {goals.map((goal) => {
                const daysRemaining = getDaysRemaining(goal.target_date);
                return (
                  <Card key={goal.id} className="p-6 gradient-card shadow-soft">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          {goal.is_achieved ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Target className="w-6 h-6 text-primary" />
                          )}
                          <div>
                            <h3 className="text-xl font-semibold">{goal.employee_name}</h3>
                            <p className="text-sm text-muted-foreground">{goal.metric_display}</p>
                          </div>
                          {goal.is_achieved && (
                            <span className="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-full">
                              Achieved
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-semibold">
                              {goal.progress_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={goal.progress_percentage} className="h-2" />
                          <div className="flex items-center justify-between mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {goal.current_value.toFixed(1)} / {goal.target_value}
                            </span>
                            {!goal.is_achieved && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {daysRemaining > 0 ? `${daysRemaining} days left` : "Overdue"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Start Value</p>
                            <p className="font-semibold">{goal.start_value}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Current Value</p>
                            <p className="font-semibold">{goal.current_value.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Target Value</p>
                            <p className="font-semibold">{goal.target_value}</p>
                          </div>
                        </div>

                        {goal.achieved_at && (
                          <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
                            <p className="text-sm text-green-600">
                              Achieved on {new Date(goal.achieved_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(goal)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeGoals;

