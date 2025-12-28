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
  Users,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2,
  Code,
  Mail,
  Building2,
  UserCircle,
  Calendar,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { getAuthToken, API_BASE } from "@/lib/api";

interface Employee {
  id: string;
  name: string;
  email?: string;
  employee_id?: string;
  leetcode_username: string;
  leetcode_url: string;
  team?: string;
  role?: string;
  auto_sync_enabled: boolean;
  sync_frequency: string;
  last_synced?: string;
  next_sync?: string;
  notes?: string;
  latest_stats?: {
    total_solved: number;
    problem_solving_score: number;
    analyzed_at?: string;
  };
  active_goals: number;
  achieved_goals: number;
}

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employee_id: "",
    leetcode_url: "",
    team: "",
    role: "",
    auto_sync_enabled: false,
    sync_frequency: "weekly",
    notes: "",
  });

  useEffect(() => {
    const currentuser = JSON.parse(localStorage.getItem("currentuser") || "null");
    if (!currentuser || currentuser.role === "jobseeker") {
      navigate("/Auth");
      return;
    }
    fetchEmployees();
  }, [navigate, filterTeam]);

  const fetchEmployees = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in");
      navigate("/Auth");
      return;
    }

    try {
      setLoading(true);
      const url = filterTeam !== "all" 
        ? `${API_BASE}/company/employees/?team=${filterTeam}`
        : `${API_BASE}/company/employees/`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        toast.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      const url = editingEmployee
        ? `${API_BASE}/company/employees/${editingEmployee.id}/`
        : `${API_BASE}/company/employees/`;

      const method = editingEmployee ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingEmployee ? "Employee updated successfully" : "Employee added successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchEmployees();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save employee");
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("Failed to save employee");
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      employee_id: employee.employee_id || "",
      leetcode_url: employee.leetcode_url,
      team: employee.team || "",
      role: employee.role || "",
      auto_sync_enabled: employee.auto_sync_enabled,
      sync_frequency: employee.sync_frequency,
      notes: employee.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return;

    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/company/employees/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Employee deactivated");
        fetchEmployees();
      } else {
        toast.error("Failed to deactivate employee");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to deactivate employee");
    }
  };

  const handleSync = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setSyncingId(id);
      const response = await fetch(`${API_BASE}/company/employees/${id}/sync/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_role: "Mid-Level" }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Synced successfully! ${data.stats?.total_solved || 0} problems solved`);
        fetchEmployees();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to sync employee");
      }
    } catch (error) {
      console.error("Error syncing employee:", error);
      toast.error("Failed to sync employee");
    } finally {
      setSyncingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      employee_id: "",
      leetcode_url: "",
      team: "",
      role: "",
      auto_sync_enabled: false,
      sync_frequency: "weekly",
      notes: "",
    });
    setEditingEmployee(null);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Try to detect delimiter (comma or semicolon)
    const delimiter = lines[0].includes(',') ? ',' : (lines[0].includes(';') ? ';' : ',');
    
    // Parse header
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Find column indices (flexible matching)
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('employee name'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const employeeIdIndex = headers.findIndex(h => h.includes('employee id') || h.includes('id') || h.includes('emp id'));
    const leetcodeUrlIndex = headers.findIndex(h => h.includes('leetcode') || h.includes('url') || h.includes('profile'));
    const teamIndex = headers.findIndex(h => h.includes('team') || h.includes('department'));
    const roleIndex = headers.findIndex(h => h.includes('role') || h.includes('title') || h.includes('position'));

    const employees: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      
      // Get LeetCode URL (required)
      let leetcodeUrl = '';
      if (leetcodeUrlIndex >= 0 && values[leetcodeUrlIndex]) {
        leetcodeUrl = values[leetcodeUrlIndex];
      } else {
        // Try to find LeetCode URL in any column
        const urlMatch = values.find(v => v.includes('leetcode.com'));
        if (urlMatch) leetcodeUrl = urlMatch;
      }

      if (!leetcodeUrl) continue; // Skip rows without LeetCode URL

      // Get name (required, use URL username as fallback)
      let name = '';
      if (nameIndex >= 0 && values[nameIndex]) {
        name = values[nameIndex];
      } else {
        // Extract username from URL as fallback
        const urlMatch = leetcodeUrl.match(/leetcode\.com\/u\/([^\/]+)/);
        name = urlMatch ? urlMatch[1] : `Employee ${i}`;
      }

      employees.push({
        name: name || `Employee ${i}`,
        email: emailIndex >= 0 ? values[emailIndex] : '',
        employee_id: employeeIdIndex >= 0 ? values[employeeIdIndex] : '',
        leetcode_url: leetcodeUrl,
        team: teamIndex >= 0 ? values[teamIndex] : '',
        role: roleIndex >= 0 ? values[roleIndex] : '',
      });
    }

    return employees;
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in");
      return;
    }

    try {
      setUploadingCsv(true);
      
      // Read CSV file
      const text = await csvFile.text();
      const employeesData = parseCSV(text);

      if (employeesData.length === 0) {
        toast.error("No valid employees found in CSV file. Please check the format.");
        return;
      }

      // Create employees one by one
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const empData of employeesData) {
        try {
          const response = await fetch(`${API_BASE}/company/employees/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...empData,
              auto_sync_enabled: false,
              sync_frequency: "weekly",
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const error = await response.json();
            failCount++;
            errors.push(`${empData.name}: ${error.error || 'Failed to create'}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${empData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} employee(s)!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to add ${failCount} employee(s). Check console for details.`);
        console.error("CSV Upload Errors:", errors);
      }

      // Refresh employee list
      fetchEmployees();
      
      // Reset and close dialog
      setCsvFile(null);
      setIsCsvDialogOpen(false);
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error("Failed to process CSV file");
    } finally {
      setUploadingCsv(false);
    }
  };

  const teams = Array.from(new Set(employees.map((e) => e.team).filter(Boolean)));

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar type="company" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-primary" />
                Employee Management
              </h1>
              <p className="text-muted-foreground">
                Manage your team's problem-solving profiles and track their progress
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary" onClick={() => resetForm()}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                  <DialogDescription>
                    Add an employee's LeetCode profile to track their problem-solving progress
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leetcode_url">LeetCode URL *</Label>
                      <Input
                        id="leetcode_url"
                        value={formData.leetcode_url}
                        onChange={(e) => setFormData({ ...formData, leetcode_url: e.target.value })}
                        placeholder="https://leetcode.com/u/username/"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="team">Team</Label>
                      <Input
                        id="team"
                        value={formData.team}
                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        placeholder="Engineering, Product, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Software Engineer, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sync_frequency">Sync Frequency</Label>
                      <Select
                        value={formData.sync_frequency}
                        onValueChange={(value) => setFormData({ ...formData, sync_frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <input
                        type="checkbox"
                        id="auto_sync"
                        checked={formData.auto_sync_enabled}
                        onChange={(e) => setFormData({ ...formData, auto_sync_enabled: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="auto_sync">Enable Auto-Sync</Label>
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
                      {editingEmployee ? "Update" : "Add"} Employee
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCsvDialogOpen} onOpenChange={(open) => {
              setIsCsvDialogOpen(open);
              if (!open) {
                setCsvFile(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setCsvFile(null)}>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Employees from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to add multiple employees at once. The CSV should include columns for name, email, LeetCode URL, team, and role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv_file" className="text-base font-semibold mb-2 block">
                      CSV File
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="csv_file"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        className="flex-1"
                      />
                      {csvFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {csvFile.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-secondary/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">CSV Format:</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your CSV file should include the following columns (case-insensitive):
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li><strong>Name</strong> or <strong>Employee Name</strong> (required)</li>
                      <li><strong>Email</strong> (optional)</li>
                      <li><strong>Employee ID</strong> or <strong>ID</strong> (optional)</li>
                      <li><strong>LeetCode URL</strong> or <strong>LeetCode</strong> or <strong>URL</strong> (required)</li>
                      <li><strong>Team</strong> or <strong>Department</strong> (optional)</li>
                      <li><strong>Role</strong> or <strong>Title</strong> or <strong>Position</strong> (optional)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      <strong>Example:</strong>
                    </p>
                    <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
{`Name,Email,LeetCode URL,Team,Role
John Doe,john@company.com,https://leetcode.com/u/johndoe/,Engineering,Software Engineer
Jane Smith,jane@company.com,https://leetcode.com/u/janesmith/,Product,Product Manager`}
                    </pre>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCsvDialogOpen(false)}
                    disabled={uploadingCsv}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="gradient-primary"
                    onClick={handleCsvUpload}
                    disabled={!csvFile || uploadingCsv}
                  >
                    {uploadingCsv ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Upload & Add Employees
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center gap-4">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchEmployees}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Employees List */}
          {loading ? (
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading employees...</p>
            </Card>
          ) : employees.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No employees found</p>
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Employee
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {employees.map((employee) => (
                <Card key={employee.id} className="p-6 gradient-card shadow-soft">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">{employee.name}</h3>
                            {employee.team && (
                              <span className="px-2 py-1 text-xs bg-secondary rounded-full">
                                {employee.team}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {employee.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {employee.email}
                              </div>
                            )}
                            {employee.role && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {employee.role}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Code className="w-4 h-4" />
                              <a
                                href={employee.leetcode_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary flex items-center gap-1"
                              >
                                {employee.leetcode_username}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      {employee.latest_stats && (
                        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-secondary/20 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Problems Solved</p>
                            <p className="text-2xl font-bold">{employee.latest_stats.total_solved}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Problem Solving Score</p>
                            <p className="text-2xl font-bold">{employee.latest_stats.problem_solving_score}/100</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Goals</p>
                            <p className="text-2xl font-bold">
                              {employee.active_goals} active, {employee.achieved_goals} achieved
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Sync Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {employee.last_synced && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Last synced: {new Date(employee.last_synced).toLocaleDateString()}
                          </div>
                        )}
                        {employee.auto_sync_enabled && (
                          <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs">
                            Auto-sync: {employee.sync_frequency}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(employee.id)}
                        disabled={syncingId === employee.id}
                      >
                        {syncingId === employee.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/company/employees/${employee.id}/progress`)}
                      >
                        View Progress
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeManagement;

