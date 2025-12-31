import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Download,
  Code,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  Filter,
  Activity,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAuthToken } from "@/lib/api";
import { API_BASE } from "@/lib/api";
import jsPDF from "jspdf";
import { useEmployees } from "@/hooks/useEmployees";

interface AnalysisResult {
  url: string;
  username: string | null;
  csv_name?: string | null;
  error: string | null;
  stats: {
    total_solved: number;
    easy_solved: number;
    medium_solved: number;
    hard_solved: number;
    total_submissions?: number;
    acceptance_rate?: number;
    ranking: number;
    reputation: number;
    star_rating?: number;
    real_name?: string;
    avatar?: string;
    country?: string;
    company?: string;
    school?: string;
    contest_rating?: number;
    contests_attended?: number;
    contest_global_ranking?: number;
    contest_top_percentage?: number;
    recent_contests?: number;
    recent_avg_rating?: number;
    submission_calendar?: Record<string, number>;
    // Advanced Metrics
    weighted_acceptance_rate?: number;
    current_streak?: number;
    max_streak?: number;
    avg_weekly_submissions?: number;
    activity_status?: string;
    community_engagement?: string;
    problem_solving_score?: number;
    score_breakdown?: {
      total: number;
      role: string;
      components: Record<string, {
        label: string;
        score: number;
        weight: number;
        value: string;
      }>;
      recommendations?: string[];
    } | null;
  } | null;
  analysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    estimated_level: string;
    insights?: string[];
  } | null;
  analyzed_at?: string; // ISO timestamp
}

interface Employee {
  id: string;
  name: string;
  leetcode_username: string;
  leetcode_url: string;
  team?: string;
}

const LeetCodeAnalysis = () => {
  const navigate = useNavigate();
  const [urls, setUrls] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);
  const [sortBy, setSortBy] = useState<string>("total_solved_desc");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [minTotalSolved, setMinTotalSolved] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Mid-Level");

  // Employee selection
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<"employees" | "manual">("employees");
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();

  // Wrapper functions for filter changes
  const handleFilterMonthChange = (value: string) => {
    setFilterMonth(value);
  };

  const handleFilterYearChange = (value: string) => {
    setFilterYear(value);
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    // Check if we have any input
    const hasEmployeeSelection = inputMode === "employees" && selectedEmployees.length > 0;
    const hasManualInput = inputMode === "manual" && (urls.trim() || csvFile);

    if (!hasEmployeeSelection && !hasManualInput) {
      toast.error("Please select employees or provide LeetCode URLs/CSV file.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in to use this feature.");
      navigate("/Auth");
      return;
    }

    setLoading(true);
    setSummary(null);

    try {
      const formData = new FormData();

      // If using employee selection, get their URLs
      if (inputMode === "employees" && selectedEmployees.length > 0) {
        const selectedUrls = selectedEmployees
          .map(id => {
            const emp = employees.find(e => e.id === id);
            return emp?.leetcode_url;
          })
          .filter(Boolean)
          .join("\n");

        if (selectedUrls) {
          formData.append("urls", selectedUrls);
        }
      } else {
        // Manual input mode
        if (csvFile) {
          formData.append("csv_file", csvFile);
        }

        if (urls.trim()) {
          formData.append("urls", urls);
        }
      }

      formData.append("target_role", targetRole);

      const response = await fetch(`${API_BASE}/company/leetcode/analyze/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze LeetCode profiles");
      }

      const data = await response.json();
      // Use analyzed_at from API response, or set current time if not provided
      const resultsWithTimestamp = (data.results || []).map((result: AnalysisResult) => ({
        ...result,
        analyzed_at: result.analyzed_at || new Date().toISOString(),
      }));

      // Debug: Log all analyzed_at dates to see what we're working with
      console.log("New analyzed_at dates:", resultsWithTimestamp.map(r => ({
        url: r.url,
        analyzed_at: r.analyzed_at,
        month: r.analyzed_at ? new Date(r.analyzed_at).getMonth() + 1 : null,
        year: r.analyzed_at ? new Date(r.analyzed_at).getFullYear() : null
      })));

      // Append new results to existing ones, but avoid duplicates based on URL + analyzed_at
      // If the same URL was analyzed again, we'll have multiple entries with different analyzed_at dates
      setResults(prevResults => {
        // Combine previous and new results
        const combined = [...prevResults, ...resultsWithTimestamp];

        // Log all months/years now available
        const allMonths = combined
          .filter(r => r.analyzed_at)
          .map(r => {
            const d = new Date(r.analyzed_at);
            return `${d.getMonth() + 1}/${d.getFullYear()}`;
          });
        const uniqueMonths = [...new Set(allMonths)];
        console.log("All available months/years after merge:", uniqueMonths);
        console.log("Total results now:", combined.length);

        return combined;
      });
      setSummary({
        total: data.total_urls || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
      });

      if (data.successful > 0) {
        toast.success(`Successfully analyzed ${data.successful} profile(s)!`);
      }
      if (data.failed > 0) {
        toast.warning(`${data.failed} profile(s) failed to analyze.`);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "An error occurred while analyzing profiles.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    // Debug: Show what months/years are in the results
    const resultMonths = results
      .filter(r => r.analyzed_at)
      .map(r => {
        const d = new Date(r.analyzed_at);
        return { month: d.getMonth() + 1, year: d.getFullYear() };
      });
    const uniqueMonths = [...new Set(resultMonths.map(r => `${r.month}/${r.year}`))];
    console.log("Available months/years in results:", uniqueMonths);
    console.log("Current filter:", { filterMonth, filterYear });

    let filtered = [...results];

    // Filter by date (month/year)
    // Only filter if at least one filter is not "all"
    const shouldFilterByDate = filterMonth !== "all" || filterYear !== "all";

    if (shouldFilterByDate) {
      filtered = filtered.filter((result) => {
        // If we need to filter by date, check if analyzed_at exists
        if (!result.analyzed_at) {
          return false;
        }

        try {
          const date = new Date(result.analyzed_at);
          // Check if date is valid
          if (isNaN(date.getTime())) {
            return false;
          }

          const resultMonth = date.getMonth() + 1; // 1-12
          const resultYear = date.getFullYear();

          // Check month filter
          let monthMatches = true;
          if (filterMonth !== "all" && filterMonth !== null && filterMonth !== undefined && filterMonth !== "") {
            const filterMonthNum = parseInt(String(filterMonth).trim(), 10);
            if (isNaN(filterMonthNum) || filterMonthNum < 1 || filterMonthNum > 12) {
              return false;
            }
            // Strict number comparison
            monthMatches = (resultMonth === filterMonthNum);

            // Debug for month 11 and 12
            if (filterMonth === "11" || filterMonth === "12") {
              console.log(`Filtering: resultMonth=${resultMonth}, filterMonthNum=${filterMonthNum}, monthMatches=${monthMatches}`, {
                analyzed_at: result.analyzed_at,
                url: result.url?.substring(0, 50)
              });
            }
          }

          // Check year filter
          let yearMatches = true;
          if (filterYear !== "all" && filterYear !== null && filterYear !== undefined && filterYear !== "") {
            const filterYearNum = parseInt(String(filterYear).trim(), 10);
            if (isNaN(filterYearNum)) {
              return false;
            }
            // Strict number comparison
            yearMatches = (resultYear === filterYearNum);
          }

          // Both conditions must match
          return monthMatches && yearMatches;
        } catch (e) {
          console.error("Error filtering by date:", e, result.analyzed_at);
          return false;
        }
      });
    }

    // Filter by minimum total solved
    if (minTotalSolved && minTotalSolved.trim() !== "") {
      const minValue = parseInt(minTotalSolved, 10);
      if (!isNaN(minValue) && minValue >= 0) {
        filtered = filtered.filter((result) => {
          if (!result.stats) return false;
          return (result.stats.total_solved || 0) >= minValue;
        });
      }
    }

    // Helper to get the relevant solved count based on filters
    const getSolvedCount = (result: AnalysisResult) => {
      if (filterMonth === "all" || !result.stats?.submission_calendar) {
        return result.stats?.total_solved || 0;
      }

      try {
        const targetMonth = parseInt(filterMonth, 10);
        const targetYear = filterYear !== "all" ? parseInt(filterYear, 10) : null;
        let count = 0;

        Object.entries(result.stats.submission_calendar).forEach(([ts, val]) => {
          try {
            const timestamp = parseInt(ts, 10);
            if (isNaN(timestamp)) return;

            const date = new Date(timestamp * 1000);
            const resultMonth = date.getMonth() + 1;
            const resultYear = date.getFullYear();

            if (resultMonth === targetMonth) {
              if (targetYear === null || resultYear === targetYear) {
                count += typeof val === 'number' ? val : parseInt(String(val), 10) || 0;
              }
            }
          } catch (e) {
            // ignore
          }
        });
        return count;
      } catch (e) {
        return 0;
      }
    };

    // Sort results
    filtered.sort((a, b) => {
      // Handle failed results (no stats)
      if (!a.stats && !b.stats) return 0;
      if (!a.stats) return 1; // Failed results go to bottom
      if (!b.stats) return -1;

      // Parse sortBy: "total_solved_desc" -> field="total_solved", order="desc"
      const lastUnderscore = sortBy.lastIndexOf("_");
      const sortField = sortBy.substring(0, lastUnderscore);
      const order = sortBy.substring(lastUnderscore + 1);
      const isDesc = order === "desc";

      let comparison = 0;

      switch (sortField) {
        case "total_solved":
        case "total":
          comparison = getSolvedCount(a) - getSolvedCount(b);
          break;
        case "easy":
          comparison = (a.stats.easy_solved || 0) - (b.stats.easy_solved || 0);
          break;
        case "medium":
          comparison = (a.stats.medium_solved || 0) - (b.stats.medium_solved || 0);
          break;
        case "hard":
          comparison = (a.stats.hard_solved || 0) - (b.stats.hard_solved || 0);
          break;
        case "ranking":
          // Lower ranking is better
          comparison = (b.stats.ranking || 0) - (a.stats.ranking || 0);
          break;
        case "reputation":
          comparison = (a.stats.reputation || 0) - (b.stats.reputation || 0);
          break;
        case "username":
          comparison = (a.username || "").localeCompare(b.username || "");
          break;
        default:
          comparison = (a.stats.total_solved || 0) - (b.stats.total_solved || 0);
      }

      return isDesc ? -comparison : comparison;
    });

    return filtered;
  }, [results, sortBy, filterMonth, filterYear, minTotalSolved]);

  // Generate month and year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleExportPDF = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const marginX = 40;
    const marginY = 60;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginX * 2;
    let cursorY = marginY;
    let pageNumber = 1;

    const addPageNumber = () => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 30, { align: "center" });
      pageNumber++;
    };

    const checkNewPage = (requiredSpace: number) => {
      if (cursorY + requiredSpace > pageHeight - 80) {
        addPageNumber();
        doc.addPage();
        cursorY = marginY;
        return true;
      }
      return false;
    };

    // Title Page
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(139, 92, 246);
    doc.text("LeetCode Analysis Results", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 40;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 30;

    doc.setDrawColor(220);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 40;

    // Summary
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Summary", marginX, cursorY);
    cursorY += 20;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Profiles: ${filteredAndSortedResults.length}`, marginX, cursorY);
    cursorY += 40;

    // Individual Profiles
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Profile Details", marginX, cursorY);
    cursorY += 30;

    filteredAndSortedResults.forEach((result, index) => {
      const stats = result.stats;
      if (!stats) return;

      checkNewPage(200);

      // Profile header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0);
      const profileName = result.csv_name || result.username || "Unknown";
      doc.text(`${index + 1}. ${profileName}`, marginX, cursorY);
      cursorY += 22;

      // Profile URL
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(result.url, marginX, cursorY);
      cursorY += 16;

      // Additional info
      if (stats.real_name || stats.company || stats.school || stats.country) {
        doc.setFontSize(10);
        const infoLines = [];
        if (stats.real_name) infoLines.push(`Name: ${stats.real_name}`);
        if (stats.company) infoLines.push(`Company: ${stats.company}`);
        if (stats.school) infoLines.push(`School: ${stats.school}`);
        if (stats.country) infoLines.push(`Country: ${stats.country}`);

        infoLines.forEach(line => {
          checkNewPage(14);
          doc.text(line, marginX, cursorY);
          cursorY += 14;
        });
        cursorY += 6;
      }

      // Activity status
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      if (stats.activity_status === "Active") {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(`Status: ${stats.activity_status || "Unknown"}`, marginX, cursorY);
      cursorY += 20;

      doc.setTextColor(0);

      // Stats
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Problem Solving Statistics", marginX, cursorY);
      cursorY += 16;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      const primaryStats = [
        `Total Problems Solved: ${stats.total_solved || 0}`,
        `  • Easy: ${stats.easy_solved || 0}`,
        `  • Medium: ${stats.medium_solved || 0}`,
        `  • Hard: ${stats.hard_solved || 0}`,
        `Acceptance Rate: ${stats.acceptance_rate || 0}%`,
        `Global Ranking: #${stats.ranking?.toLocaleString() || "N/A"}`,
        `Reputation: ${stats.reputation || 0}`,
      ];

      primaryStats.forEach((stat) => {
        checkNewPage(14);
        doc.text(stat, marginX, cursorY);
        cursorY += 14;
      });
      cursorY += 10;

      // Contest Performance
      if (stats.contest_rating !== undefined || stats.contests_attended !== undefined) {
        checkNewPage(80);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Contest Performance", marginX, cursorY);
        cursorY += 16;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        const contestStats = [];
        if (stats.contest_rating !== undefined) contestStats.push(`Contest Rating: ${stats.contest_rating}`);
        if (stats.contests_attended !== undefined) contestStats.push(`Contests Attended: ${stats.contests_attended}`);
        if (stats.contest_global_ranking !== undefined && stats.contest_global_ranking > 0) {
          contestStats.push(`Contest Ranking: #${stats.contest_global_ranking.toLocaleString()}`);
        }
        if (stats.contest_top_percentage !== undefined) {
          contestStats.push(`Top ${stats.contest_top_percentage}%`);
        }

        contestStats.forEach((stat) => {
          checkNewPage(14);
          doc.text(stat, marginX, cursorY);
          cursorY += 14;
        });
        cursorY += 10;
      }

      // Score Breakdown
      if (stats.score_breakdown?.components) {
        checkNewPage(100);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Problem Solving Score Breakdown", marginX, cursorY);
        cursorY += 16;

        doc.setFontSize(10);
        doc.setTextColor(139, 92, 246);
        doc.text(`Overall Score: ${stats.problem_solving_score || 0}/100 (${stats.score_breakdown.role} Profile)`, marginX, cursorY);
        cursorY += 16;

        doc.setTextColor(0);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);

        Object.entries(stats.score_breakdown.components).forEach(([key, component]) => {
          checkNewPage(30);

          const componentText = `${component.label} (${Math.round(component.weight * 100)}%): ${component.score}/100`;
          doc.setFont("Helvetica", "bold");
          doc.text(componentText, marginX, cursorY);
          cursorY += 12;

          // Progress bar
          const barWidth = 200;
          const barHeight = 6;
          const fillWidth = (component.score / 100) * barWidth;

          doc.setFillColor(220, 220, 220);
          doc.rect(marginX, cursorY, barWidth, barHeight, "F");

          if (component.score >= 80) {
            doc.setFillColor(16, 185, 129);
          } else if (component.score >= 50) {
            doc.setFillColor(234, 179, 8);
          } else {
            doc.setFillColor(239, 68, 68);
          }
          doc.rect(marginX, cursorY, Math.max(fillWidth, 2), barHeight, "F");
          cursorY += barHeight + 10;

          doc.setFont("Helvetica", "normal");
          doc.setTextColor(100);
          const valueLines = doc.splitTextToSize(component.value, contentWidth - 20);
          valueLines.forEach((line: string) => {
            checkNewPage(12);
            doc.text(line, marginX + 10, cursorY);
            cursorY += 12;
          });
          cursorY += 6;
          doc.setTextColor(0);
        });
        cursorY += 10;
      }

      // AI Analysis
      if (result.analysis) {
        checkNewPage(100);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(139, 92, 246);
        doc.text(`AI Skill Analysis${result.analysis.estimated_level ? ` - ${result.analysis.estimated_level}` : ""}`, marginX, cursorY);
        cursorY += 16;

        if (result.analysis.summary) {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100);
          const summaryLines = doc.splitTextToSize(result.analysis.summary, contentWidth);
          summaryLines.forEach((line: string) => {
            checkNewPage(12);
            doc.text(line, marginX, cursorY);
            cursorY += 12;
          });
          cursorY += 10;
        }

        doc.setTextColor(0);

        if (result.analysis.strengths && result.analysis.strengths.length > 0) {
          checkNewPage(40);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(16, 185, 129);
          doc.text("Strengths:", marginX, cursorY);
          cursorY += 14;

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(0);
          result.analysis.strengths.forEach((strength) => {
            checkNewPage(20);
            const strengthLines = doc.splitTextToSize(`• ${strength}`, contentWidth - 20);
            strengthLines.forEach((line: string) => {
              checkNewPage(12);
              doc.text(line, marginX + 10, cursorY);
              cursorY += 12;
            });
          });
          cursorY += 10;
        }

        if (result.analysis.recommendations && result.analysis.recommendations.length > 0) {
          checkNewPage(40);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(59, 130, 246);
          doc.text("Recommendations:", marginX, cursorY);
          cursorY += 14;

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(0);
          result.analysis.recommendations.forEach((rec) => {
            checkNewPage(20);
            const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth - 20);
            recLines.forEach((line: string) => {
              checkNewPage(12);
              doc.text(line, marginX + 10, cursorY);
              cursorY += 12;
            });
          });
          cursorY += 10;
        }
      }

      // Separator
      if (index < filteredAndSortedResults.length - 1) {
        cursorY += 10;
        checkNewPage(20);
        doc.setDrawColor(220);
        doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
        cursorY += 20;
      }
    });

    addPageNumber();
    doc.save(`leetcode-analysis-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleExport = async (format: "excel" | "csv") => {
    if (results.length === 0) {
      toast.error("No results to export. Please analyze profiles first.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Please log in to export results.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/company/leetcode/export/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          results: filteredAndSortedResults,
          format: format,
          filter_month: filterMonth,
          filter_year: filterYear,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export results");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leetcode_analysis.${format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Results exported successfully as ${format.toUpperCase()}!`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export results.");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="print:hidden">
        <DashboardSidebar type="company" />
      </div>

      <main className="flex-1 p-8 print:p-0">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="mb-8 print:hidden">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Code className="w-10 h-10 text-primary" />
              LeetCode Profile Analysis
            </h1>
            <p className="text-muted-foreground">
              Analyze multiple LeetCode profiles by selecting employees or entering URLs/uploading CSV
            </p>
          </div>

          {/* Input Section */}
          <Card className="p-6 gradient-card shadow-soft mb-6 print:hidden">
            <div className="space-y-6">
              {/* Input Mode Toggle */}
              <div className="flex gap-2 border-b pb-4">
                <Button
                  type="button"
                  variant={inputMode === "employees" ? "default" : "outline"}
                  onClick={() => setInputMode("employees")}
                  className={inputMode === "employees" ? "gradient-primary" : ""}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Select Employees
                </Button>
                <Button
                  type="button"
                  variant={inputMode === "manual" ? "default" : "outline"}
                  onClick={() => setInputMode("manual")}
                  className={inputMode === "manual" ? "gradient-primary" : ""}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Manual Input / CSV
                </Button>
              </div>

              {/* Employee Selection Mode */}
              {inputMode === "employees" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">
                      Select Employees to Analyze
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmployeeList(!showEmployeeList)}
                      >
                        {showEmployeeList ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {loadingEmployees ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2 text-muted-foreground">Loading employees...</span>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="p-6 border border-dashed rounded-lg text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No employees found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/company/employees")}
                      >
                        Add Employees
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 text-sm text-muted-foreground">
                        {selectedEmployees.length} of {employees.length} selected
                      </div>
                      {showEmployeeList && (
                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                          {employees.map((employee) => (
                            <div
                              key={employee.id}
                              className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => handleEmployeeToggle(employee.id)}
                            >
                              <Checkbox
                                checked={selectedEmployees.includes(employee.id)}
                                onCheckedChange={() => handleEmployeeToggle(employee.id)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {employee.leetcode_username}
                                  {employee.team && ` • ${employee.team}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedEmployees.length > 0 && (
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                          <p className="text-sm font-medium mb-2">Selected Employees:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmployees.map((id) => {
                              const emp = employees.find(e => e.id === id);
                              return emp ? (
                                <span
                                  key={id}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                                >
                                  {emp.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Manual Input Mode */}
              {inputMode === "manual" && (
                <>
                  <div>
                    <Label htmlFor="urls" className="text-base font-semibold mb-2 block">
                      LeetCode URLs
                    </Label>
                    <Textarea
                      id="urls"
                      placeholder="Enter LeetCode URLs (one per line or comma-separated)&#10;Example:&#10;https://leetcode.com/u/username1/&#10;https://leetcode.com/u/username2/"
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      rows={6}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      You can enter multiple URLs separated by commas or new lines
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <Label htmlFor="csv" className="text-base font-semibold mb-2 block">
                      Or Upload CSV File
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="csv"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {csvFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {csvFile.name}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      CSV file should contain LeetCode URLs in any column
                    </p>
                  </div>
                </>
              )}

              {/* Target Role Selection */}
              <div>
                <Label htmlFor="role" className="text-base font-semibold mb-2 block flex items-center gap-2">
                  Target Role
                  <span className="text-xs font-normal text-muted-foreground" title="The scoring profile adjusts weights for different components based on role expectations. Intern profiles emphasize consistency and learning, while Senior profiles focus on hard problems and solution quality.">
                    ℹ️
                  </span>
                </Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Target Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intern">Intern / Junior (Focus on Consistency)</SelectItem>
                    <SelectItem value="Mid-Level">Mid-Level (Balanced)</SelectItem>
                    <SelectItem value="Senior">Senior (Focus on Hard Problems & Quality)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Adjusts the scoring algorithm based on role expectations.
                </p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={
                  loading ||
                  (inputMode === "employees" && selectedEmployees.length === 0) ||
                  (inputMode === "manual" && !urls.trim() && !csvFile)
                }
                className="w-full gradient-primary"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Code className="w-5 h-5 mr-2" />
                    Analyze Profiles
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Summary Section */}
          {summary && (
            <Card className="p-6 gradient-card shadow-soft mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary/20 rounded-lg">
                  <div className="text-2xl font-bold">{summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total URLs</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </Card>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <Card className="p-6 gradient-card shadow-soft mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold">
                    Analysis Results ({filteredAndSortedResults.length})
                  </h2>
                  {results.length > 0 && (
                    <Button
                      onClick={() => {
                        if (confirm("Are you sure you want to clear all results? This cannot be undone.")) {
                          setResults([]);
                          setSummary(null);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 print:hidden"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Filters and Sort Controls */}
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  {/* Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={filterMonth} onValueChange={handleFilterMonthChange}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterYear} onValueChange={handleFilterYearChange}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="min-solved" className="text-sm whitespace-nowrap">
                        Min Solved:
                      </Label>
                      <Input
                        id="min-solved"
                        type="number"
                        placeholder="0"
                        value={minTotalSolved}
                        onChange={(e) => setMinTotalSolved(e.target.value)}
                        className="w-20 h-9"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Sort Control */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total_solved_desc">
                          Total Solved (High to Low)
                        </SelectItem>
                        <SelectItem value="total_solved_asc">
                          Total Solved (Low to High)
                        </SelectItem>
                        <SelectItem value="hard_desc">Hard Problems (High to Low)</SelectItem>
                        <SelectItem value="hard_asc">Hard Problems (Low to High)</SelectItem>
                        <SelectItem value="medium_desc">Medium Problems (High to Low)</SelectItem>
                        <SelectItem value="medium_asc">Medium Problems (Low to High)</SelectItem>
                        <SelectItem value="easy_desc">Easy Problems (High to Low)</SelectItem>
                        <SelectItem value="easy_asc">Easy Problems (Low to High)</SelectItem>
                        <SelectItem value="ranking_asc">Ranking (Best First)</SelectItem>
                        <SelectItem value="ranking_desc">Ranking (Worst First)</SelectItem>
                        <SelectItem value="reputation_desc">Reputation (High to Low)</SelectItem>
                        <SelectItem value="reputation_asc">Reputation (Low to High)</SelectItem>
                        <SelectItem value="username_asc">Username (A-Z)</SelectItem>
                        <SelectItem value="username_desc">Username (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate("/company/leetcode-report", { state: { results: filteredAndSortedResults } })}
                      variant="default"
                      className="gap-2 gradient-primary"
                    >
                      <Activity className="w-4 h-4" />
                      View Visual Report
                    </Button>
                    <Button
                      onClick={() => handleExport("excel")}
                      variant="outline"
                      className="gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </Button>
                    <Button
                      onClick={() => handleExport("csv")}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredAndSortedResults.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No results match the selected filters</p>
                    <p className="text-sm">
                      {filterMonth !== "all" && filterYear !== "all"
                        ? `No results found for ${months.find(m => m.value === filterMonth)?.label || filterMonth} ${filterYear}`
                        : filterMonth !== "all"
                          ? `No results found for ${months.find(m => m.value === filterMonth)?.label || filterMonth}`
                          : filterYear !== "all"
                            ? `No results found for year ${filterYear}`
                            : "No results found"}
                    </p>
                    <p className="text-xs mt-2">Try selecting different month or year filters, or clear the filters to see all results.</p>
                  </div>
                ) : (
                  filteredAndSortedResults.map((result, index) => (
                    <div
                      key={`${result.url}-${result.analyzed_at}-${index}`}
                      className={`border rounded-xl p-6 ${result.stats
                        ? "bg-card/50 hover:bg-card/80"
                        : "bg-red-500/5 border-red-500/20"
                        } transition-all`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {/* Avatar */}
                            {result.stats?.avatar ? (
                              <img
                                src={result.stats.avatar}
                                alt={result.username || "Profile"}
                                className="w-12 h-12 rounded-full border-2 border-primary/20"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                                <Code className="w-6 h-6 text-primary-foreground" />
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {result.stats ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline font-medium"
                                >
                                  {result.url}
                                </a>
                              </div>

                              {/* CSV Name */}
                              {result.csv_name && (
                                <p className="text-sm font-semibold text-foreground mb-1">
                                  {result.csv_name}
                                </p>
                              )}

                              {/* Real Name from LeetCode */}
                              {result.stats?.real_name && (
                                <p className="text-sm text-muted-foreground">
                                  Name: <span className="font-medium">{result.stats.real_name}</span>
                                </p>
                              )}

                              {result.username && (
                                <p className="text-sm text-muted-foreground">
                                  Username: <span className="font-medium">{result.username}</span>
                                </p>
                              )}

                              {/* Additional Info */}
                              {(result.stats?.company || result.stats?.school || result.stats?.country) && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {result.stats.company && (
                                    <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                                      {result.stats.company}
                                    </span>
                                  )}
                                  {result.stats.school && (
                                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 rounded">
                                      {result.stats.school}
                                    </span>
                                  )}
                                  {result.stats.country && (
                                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded">
                                      {result.stats.country}
                                    </span>
                                  )}
                                </div>
                              )}

                              {result.analyzed_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Analyzed: {new Date(result.analyzed_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {result.error && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-medium mb-1">{result.error}</p>
                                  <div className="text-xs text-red-500 dark:text-red-500/80 mt-2 space-y-1">
                                    <p><strong>Possible reasons:</strong></p>
                                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                                      <li>Username is incorrect or misspelled</li>
                                      <li>Profile is set to private</li>
                                      <li>User has no submission history</li>
                                      <li>Account may have been deleted</li>
                                    </ul>
                                    <p className="mt-2">
                                      <strong>Tip:</strong> Verify the username by visiting{" "}
                                      <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-red-700 dark:hover:text-red-300"
                                      >
                                        the profile page
                                      </a>{" "}
                                      directly.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {result.stats && (
                        <div className="space-y-4">
                          {/* Primary Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-secondary/30 p-3 rounded-lg text-center">
                              {filterMonth !== "all" ? (
                                result.stats.submission_calendar ? (
                                  <>
                                    <div className="text-2xl font-bold">
                                      {(() => {
                                        try {
                                          const targetMonth = parseInt(filterMonth, 10);
                                          const targetYear = filterYear !== "all" ? parseInt(filterYear, 10) : null;
                                          let count = 0;

                                          Object.entries(result.stats.submission_calendar).forEach(([ts, val]) => {
                                            try {
                                              // LeetCode submission_calendar uses Unix timestamp in seconds as string keys
                                              const timestamp = parseInt(ts, 10);
                                              if (isNaN(timestamp)) return;

                                              const date = new Date(timestamp * 1000);
                                              const resultMonth = date.getMonth() + 1;
                                              const resultYear = date.getFullYear();

                                              // Match month, and year if specified
                                              if (resultMonth === targetMonth) {
                                                if (targetYear === null || resultYear === targetYear) {
                                                  count += typeof val === 'number' ? val : parseInt(String(val), 10) || 0;
                                                }
                                              }
                                            } catch (e) {
                                              console.warn("Error parsing submission calendar entry:", ts, e);
                                            }
                                          });

                                          return count;
                                        } catch (e) {
                                          console.error("Error calculating submission count:", e);
                                          return 0;
                                        }
                                      })()}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                      {filterYear !== "all"
                                        ? `Submissions in ${months.find(m => m.value === filterMonth)?.label} ${filterYear}`
                                        : `Submissions in ${months.find(m => m.value === filterMonth)?.label}`}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-2xl font-bold">{result.stats.total_solved || 0}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                      Total Solved
                                    </div>
                                  </>
                                )
                              ) : (
                                <>
                                  <div className="text-2xl font-bold">{result.stats.total_solved || 0}</div>
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Total Solved
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="bg-green-500/10 p-3 rounded-lg text-center text-green-600">
                              <div className="text-2xl font-bold">{result.stats.easy_solved || 0}</div>
                              <div className="text-xs uppercase tracking-wider">Easy {filterMonth !== "all" && "(All-Time)"}</div>
                            </div>
                            <div className="bg-yellow-500/10 p-3 rounded-lg text-center text-yellow-600">
                              <div className="text-2xl font-bold">{result.stats.medium_solved || 0}</div>
                              <div className="text-xs uppercase tracking-wider">Medium {filterMonth !== "all" && "(All-Time)"}</div>
                            </div>
                            <div className="bg-red-500/10 p-3 rounded-lg text-center text-red-600">
                              <div className="text-2xl font-bold">{result.stats.hard_solved || 0}</div>
                              <div className="text-xs uppercase tracking-wider">Hard {filterMonth !== "all" && "(All-Time)"}</div>
                            </div>
                          </div>

                          {/* Additional Important Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {result.stats.acceptance_rate !== undefined && (
                              <div className="bg-blue-500/10 p-3 rounded-lg text-center text-blue-600">
                                <div className="text-xl font-bold">{result.stats.acceptance_rate}%</div>
                                <div className="text-xs uppercase tracking-wider">Acceptance Rate</div>
                              </div>
                            )}
                            {result.stats.total_submissions !== undefined && (
                              <div className="bg-purple-500/10 p-3 rounded-lg text-center text-purple-600">
                                <div className="text-xl font-bold">{result.stats.total_submissions || 0}</div>
                                <div className="text-xs uppercase tracking-wider">Total Submissions</div>
                              </div>
                            )}
                            {result.stats.ranking > 0 && (
                              <div className="bg-orange-500/10 p-3 rounded-lg text-center text-orange-600">
                                <div className="text-xl font-bold">#{result.stats.ranking.toLocaleString()}</div>
                                <div className="text-xs uppercase tracking-wider">Global Ranking</div>
                              </div>
                            )}
                            {result.stats.reputation > 0 && (
                              <div className="bg-indigo-500/10 p-3 rounded-lg text-center text-indigo-600">
                                <div className="text-xl font-bold">{result.stats.reputation}</div>
                                <div className="text-xs uppercase tracking-wider">Reputation</div>
                              </div>
                            )}
                          </div>

                          {/* Contest Information */}
                          {(result.stats.contest_rating !== undefined || result.stats.contests_attended !== undefined) && (
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                              <h5 className="font-semibold mb-3 text-purple-600 flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Contest Performance
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {result.stats.contest_rating !== undefined && (
                                  <div>
                                    <div className="text-lg font-bold">{result.stats.contest_rating}</div>
                                    <div className="text-xs text-muted-foreground">Contest Rating</div>
                                  </div>
                                )}
                                {result.stats.contests_attended !== undefined && (
                                  <div>
                                    <div className="text-lg font-bold">{result.stats.contests_attended}</div>
                                    <div className="text-xs text-muted-foreground">Contests Attended</div>
                                  </div>
                                )}
                                {result.stats.contest_global_ranking !== undefined && result.stats.contest_global_ranking > 0 && (
                                  <div>
                                    <div className="text-lg font-bold">#{result.stats.contest_global_ranking.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Contest Ranking</div>
                                  </div>
                                )}
                                {result.stats.contest_top_percentage !== undefined && (
                                  <div>
                                    <div className="text-lg font-bold">Top {result.stats.contest_top_percentage}%</div>
                                    <div className="text-xs text-muted-foreground">Top Percentage</div>
                                  </div>
                                )}
                              </div>
                              {result.stats.recent_contests !== undefined && result.stats.recent_contests > 0 && (
                                <div className="mt-3 pt-3 border-t border-purple-500/20">
                                  <div className="text-sm text-muted-foreground">
                                    Recent Contests: {result.stats.recent_contests}
                                    {result.stats.recent_avg_rating && ` • Avg Rating: ${result.stats.recent_avg_rating}`}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Advanced Metrics Section */}
                          <div className="mt-6 border-t pt-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-primary" />
                              Advanced Metrics & Insights
                            </h3>

                            {/* Score Breakdown */}
                            {result.stats.score_breakdown ? (
                              <div className="mb-6 bg-secondary/20 p-4 rounded-lg border border-border/50">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <div className="text-sm text-muted-foreground">Problem Solving Score</div>
                                    <div className="flex items-end gap-2">
                                      <div className="text-3xl font-bold text-primary">
                                        {result.stats.problem_solving_score || 0}
                                      </div>
                                      <div className="text-sm text-muted-foreground mb-1">/ 100</div>
                                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full mb-1 ml-2">
                                        {result.stats.score_breakdown.role} Profile
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-primary">
                                      {result.stats.problem_solving_score && result.stats.problem_solving_score >= 80 ? "Excellent" :
                                        result.stats.problem_solving_score && result.stats.problem_solving_score >= 60 ? "Good" :
                                          "Needs Improvement"}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {Object.entries(result.stats.score_breakdown.components).map(([key, comp]) => (
                                    <div key={key}>
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="flex items-center gap-1">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="cursor-help border-b border-dotted border-muted-foreground/50">
                                                  {comp.label}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                                                <p className="text-xs">
                                                  {key === 'difficulty' && "Measures the balance of problems solved across Easy, Medium, and Hard levels."}
                                                  {key === 'quality' && "Evaluates the efficiency and correctness of solutions."}
                                                  {key === 'consistency' && "Tracks how regularly the user practices and their current streak."}
                                                  {key === 'volume' && "Reflects total problems solved and global ranking."}
                                                  {key === 'engagement' && "Measures interaction with the community and reputation."}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <span className="text-xs text-muted-foreground">({Math.round(comp.weight * 100)}%)</span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                          {key === 'engagement' && comp.score === 0 ? (
                                            <span className="text-xs text-muted-foreground">Not Available</span>
                                          ) : (
                                            <>
                                              <span className="font-medium">{comp.score}/100</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded ${comp.score >= 80 ? 'bg-green-500/10 text-green-600' :
                                                comp.score >= 50 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                                                }`}>
                                                {comp.score >= 80 ? 'Strong' : comp.score >= 50 ? 'Moderate' : 'Low'}
                                              </span>
                                            </>
                                          )}
                                        </span>
                                      </div>
                                      <div className="w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${comp.score >= 80 ? 'bg-green-500' :
                                            comp.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                          style={{ width: `${Math.max(comp.score, 2)}%` }}
                                        />
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {comp.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Recommendations Section */}
                                {result.stats.score_breakdown?.recommendations && result.stats.score_breakdown.recommendations.length > 0 && (
                                  <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4" />
                                      Personalized Recommendations
                                    </div>
                                    <ul className="space-y-1.5">
                                      {result.stats.score_breakdown.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm flex items-start gap-2 text-blue-700 dark:text-blue-300">
                                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                          <span>{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* Fallback for old data without breakdown */}
                                <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                                  <div className="text-sm text-muted-foreground mb-1">Problem Solving Score</div>
                                  <div className="flex items-end gap-2">
                                    <div className="text-3xl font-bold text-primary">
                                      {result.stats.problem_solving_score || 0}
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-1">/ 100</div>
                                  </div>
                                  <div className="w-full bg-secondary/50 h-2 rounded-full mt-2 overflow-hidden">
                                    <div
                                      className="bg-primary h-full rounded-full transition-all duration-500"
                                      style={{ width: `${result.stats.problem_solving_score || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              {/* Consistency Stats */}
                              <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                                <div className="text-sm text-muted-foreground mb-3">Consistency & Activity</div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Current Streak:</span>
                                    <span className="font-medium">{result.stats.current_streak || 0} days</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Max Streak:</span>
                                    <span className="font-medium">{result.stats.max_streak || 0} days</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Weekly Avg:</span>
                                    <span className="font-medium">{result.stats.avg_weekly_submissions || 0} subs</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Status:</span>
                                    <span className={`font-medium ${result.stats.activity_status === 'Active' ? 'text-green-500' : 'text-muted-foreground'
                                      }`}>
                                      {result.stats.activity_status || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Quality & Engagement */}
                              <div className="bg-secondary/20 p-4 rounded-lg border border-border/50">
                                <div className="text-sm text-muted-foreground mb-3">Quality & Engagement</div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Weighted Acceptance:</span>
                                    <span className="font-medium">{result.stats.weighted_acceptance_rate || 0}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Raw Acceptance:</span>
                                    <span className="text-muted-foreground">{result.stats.acceptance_rate || 0}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Engagement:</span>
                                    <span className={`font-medium px-2 py-0.5 rounded text-xs ${result.stats.community_engagement === 'High' ? 'bg-purple-500/10 text-purple-600' :
                                      result.stats.community_engagement === 'Medium' ? 'bg-blue-500/10 text-blue-600' :
                                        'bg-gray-500/10 text-gray-600'
                                      }`}>
                                      {result.stats.community_engagement || 'Low'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* AI Insights */}
                            {result.analysis?.insights && result.analysis.insights.length > 0 && (
                              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <div className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4" />
                                  AI Insights
                                </div>
                                <ul className="space-y-1">
                                  {result.analysis.insights.map((insight, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                      <span>{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* AI Analysis */}
                          {result.analysis && (
                            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                              <div className="flex items-center gap-2 mb-3">
                                <Code className="w-5 h-5 text-primary" />
                                <h4 className="font-semibold text-primary">AI Skill Analysis</h4>
                                {result.analysis.estimated_level && (
                                  <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                                    {result.analysis.estimated_level}
                                  </span>
                                )}
                              </div>

                              {result.analysis.summary && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  {result.analysis.summary}
                                </p>
                              )}

                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {result.analysis.strengths && result.analysis.strengths.length > 0 && (
                                  <div>
                                    <h5 className="font-medium mb-2 text-green-600">Strengths</h5>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                      {result.analysis.strengths.map((s, i) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {result.analysis.recommendations &&
                                  result.analysis.recommendations.length > 0 && (
                                    <div>
                                      <h5 className="font-medium mb-2 text-blue-600">
                                        Recommendations
                                      </h5>
                                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        {result.analysis.recommendations.map((r, i) => (
                                          <li key={i}>{r}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeetCodeAnalysis;

