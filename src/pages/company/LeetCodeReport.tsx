import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import {
    Download,
    TrendingUp,
    Users,
    Award,
    Activity,
    BarChart3,
    PieChart as PieChartIcon,
    FileText,
    ArrowLeft,
} from "lucide-react";
import jsPDF from "jspdf";

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
        weighted_acceptance_rate?: number;
        current_streak?: number;
        max_streak?: number;
        avg_weekly_submissions?: number;
        activity_status?: string;
        community_engagement?: string;
        problem_solving_score?: number;
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
    analyzed_at?: string;
}

const COLORS = {
    primary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    easy: "#10B981",
    medium: "#F59E0B",
    hard: "#EF4444",
};

const LeetCodeReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("score_desc");

    useEffect(() => {
        // Get results from location state (passed from LeetCodeAnalysis page)
        if (location.state?.results) {
            setResults(location.state.results);
        }
    }, [location.state]);

    // Filter and sort results
    const filteredAndSortedResults = useMemo(() => {
        let filtered = results.filter((r) => r.stats !== null);

        // Filter by activity status
        if (filterStatus !== "all") {
            filtered = filtered.filter(
                (r) => r.stats?.activity_status?.toLowerCase() === filterStatus.toLowerCase()
            );
        }

        // Sort results
        filtered.sort((a, b) => {
            if (!a.stats || !b.stats) return 0;

            const [field, order] = sortBy.split("_");
            let comparison = 0;

            switch (field) {
                case "score":
                    comparison = (a.stats.problem_solving_score || 0) - (b.stats.problem_solving_score || 0);
                    break;
                case "total":
                    comparison = (a.stats.total_solved || 0) - (b.stats.total_solved || 0);
                    break;
                case "hard":
                    comparison = (a.stats.hard_solved || 0) - (b.stats.hard_solved || 0);
                    break;
                case "streak":
                    comparison = (a.stats.max_streak || 0) - (b.stats.max_streak || 0);
                    break;
                default:
                    comparison = 0;
            }

            return order === "desc" ? -comparison : comparison;
        });

        return filtered;
    }, [results, filterStatus, sortBy]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const validResults = results.filter((r) => r.stats !== null);
        const totalAnalyzed = validResults.length;
        const avgScore =
            validResults.reduce((sum, r) => sum + (r.stats?.problem_solving_score || 0), 0) / totalAnalyzed || 0;
        const avgSolved =
            validResults.reduce((sum, r) => sum + (r.stats?.total_solved || 0), 0) / totalAnalyzed || 0;
        const activeCount = validResults.filter((r) => r.stats?.activity_status === "Active").length;

        return {
            totalAnalyzed,
            avgScore: Math.round(avgScore),
            avgSolved: Math.round(avgSolved),
            activeCount,
            activePercentage: totalAnalyzed > 0 ? Math.round((activeCount / totalAnalyzed) * 100) : 0,
        };
    }, [results]);

    // Prepare data for charts
    const difficultyDistribution = useMemo(() => {
        const validResults = filteredAndSortedResults;
        const totalEasy = validResults.reduce((sum, r) => sum + (r.stats?.easy_solved || 0), 0);
        const totalMedium = validResults.reduce((sum, r) => sum + (r.stats?.medium_solved || 0), 0);
        const totalHard = validResults.reduce((sum, r) => sum + (r.stats?.hard_solved || 0), 0);

        return [
            { name: "Easy", value: totalEasy, color: COLORS.easy },
            { name: "Medium", value: totalMedium, color: COLORS.medium },
            { name: "Hard", value: totalHard, color: COLORS.hard },
        ];
    }, [filteredAndSortedResults]);

    const scoreDistribution = useMemo(() => {
        const ranges = [
            { range: "0-20", min: 0, max: 20, count: 0 },
            { range: "21-40", min: 21, max: 40, count: 0 },
            { range: "41-60", min: 41, max: 60, count: 0 },
            { range: "61-80", min: 61, max: 80, count: 0 },
            { range: "81-100", min: 81, max: 100, count: 0 },
        ];

        filteredAndSortedResults.forEach((r) => {
            const score = r.stats?.problem_solving_score || 0;
            const range = ranges.find((rng) => score >= rng.min && score <= rng.max);
            if (range) range.count++;
        });

        return ranges.map((r) => ({ name: r.range, count: r.count }));
    }, [filteredAndSortedResults]);

    const activityStatusData = useMemo(() => {
        const active = filteredAndSortedResults.filter((r) => r.stats?.activity_status === "Active").length;
        const inactive = filteredAndSortedResults.length - active;

        return [
            { name: "Active", value: active, color: COLORS.success },
            { name: "Inactive", value: inactive, color: COLORS.danger },
        ];
    }, [filteredAndSortedResults]);

    const topPerformers = useMemo(() => {
        return filteredAndSortedResults
            .slice(0, 10)
            .map((r) => ({
                name: r.csv_name || r.username || "Unknown",
                score: r.stats?.problem_solving_score || 0,
                total: r.stats?.total_solved || 0,
            }));
    }, [filteredAndSortedResults]);

    // Export to PDF
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

        // Helper function to add page number
        const addPageNumber = () => {
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 30, { align: "center" });
            pageNumber++;
        };

        // Helper function to check if we need a new page
        const checkNewPage = (requiredSpace: number) => {
            if (cursorY + requiredSpace > pageHeight - 80) {
                addPageNumber();
                doc.addPage();
                cursorY = marginY;
                return true;
            }
            return false;
        };

        // Helper function to add section title
        const addSectionTitle = (title: string) => {
            checkNewPage(40);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text(title, marginX, cursorY);
            cursorY += 30;
        };

        // Helper function to add text
        const addText = (text: string, fontSize = 11, isBold = false) => {
            checkNewPage(20);
            doc.setFont("Helvetica", isBold ? "bold" : "normal");
            doc.setFontSize(fontSize);
            doc.setTextColor(0);
            const lines = doc.splitTextToSize(text, contentWidth);
            lines.forEach((line: string) => {
                checkNewPage(16);
                doc.text(line, marginX, cursorY);
                cursorY += 16;
            });
        };

        // Title Page
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(139, 92, 246); // Primary color
        doc.text("LeetCode Visual Report", pageWidth / 2, cursorY, { align: "center" });
        cursorY += 40;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, cursorY, { align: "center" });
        cursorY += 30;

        doc.setDrawColor(220);
        doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
        cursorY += 40;

        // Summary Statistics
        addSectionTitle("Summary Statistics");

        const stats = [
            `Total Profiles Analyzed: ${summaryStats.totalAnalyzed}`,
            `Average Problem-Solving Score: ${summaryStats.avgScore}`,
            `Average Problems Solved: ${summaryStats.avgSolved}`,
            `Active Users: ${summaryStats.activeCount} (${summaryStats.activePercentage}%)`,
        ];

        stats.forEach((stat) => {
            addText(stat, 11, false);
            cursorY += 5;
        });

        cursorY += 20;

        // Difficulty Distribution
        addSectionTitle("Problem Difficulty Distribution");

        const totalEasy = difficultyDistribution.find((d) => d.name === "Easy")?.value || 0;
        const totalMedium = difficultyDistribution.find((d) => d.name === "Medium")?.value || 0;
        const totalHard = difficultyDistribution.find((d) => d.name === "Hard")?.value || 0;
        const totalProblems = totalEasy + totalMedium + totalHard;

        addText(`Easy: ${totalEasy} (${totalProblems > 0 ? ((totalEasy / totalProblems) * 100).toFixed(1) : 0}%)`);
        addText(`Medium: ${totalMedium} (${totalProblems > 0 ? ((totalMedium / totalProblems) * 100).toFixed(1) : 0}%)`);
        addText(`Hard: ${totalHard} (${totalProblems > 0 ? ((totalHard / totalProblems) * 100).toFixed(1) : 0}%)`);
        cursorY += 20;

        // Score Distribution
        addSectionTitle("Score Distribution");

        scoreDistribution.forEach((range) => {
            addText(`${range.name}: ${range.count} candidate(s)`);
        });
        cursorY += 20;

        // Activity Status
        addSectionTitle("Activity Status");

        const activeUsers = activityStatusData.find((d) => d.name === "Active")?.value || 0;
        const inactiveUsers = activityStatusData.find((d) => d.name === "Inactive")?.value || 0;

        addText(`Active: ${activeUsers}`);
        addText(`Inactive: ${inactiveUsers}`);
        cursorY += 20;

        // Top Performers
        if (topPerformers.length > 0) {
            addSectionTitle("Top 10 Performers");

            topPerformers.forEach((performer, index) => {
                checkNewPage(20);
                addText(`${index + 1}. ${performer.name} - Score: ${performer.score}, Total Solved: ${performer.total}`);
            });
            cursorY += 20;
        }

        // Individual Profile Analysis
        addSectionTitle("Individual Profile Analysis");

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

            // Additional profile info (company, school, country)
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
                doc.setTextColor(16, 185, 129); // Green
            } else {
                doc.setTextColor(239, 68, 68); // Red
            }
            doc.text(`Status: ${stats.activity_status || "Unknown"}`, marginX, cursorY);
            cursorY += 20;

            // Reset color
            doc.setTextColor(0);

            // Primary Stats Section
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
                `Total Submissions: ${stats.total_submissions || 0}`,
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
                if (stats.recent_contests !== undefined && stats.recent_contests > 0) {
                    let recentText = `Recent Contests: ${stats.recent_contests}`;
                    if (stats.recent_avg_rating) recentText += ` (Avg Rating: ${stats.recent_avg_rating})`;
                    contestStats.push(recentText);
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

                // Overall score
                doc.setFontSize(10);
                doc.setTextColor(139, 92, 246); // Primary color
                doc.text(`Overall Score: ${stats.problem_solving_score || 0}/100 (${stats.score_breakdown.role} Profile)`, marginX, cursorY);
                cursorY += 16;

                doc.setTextColor(0);
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(9);

                Object.entries(stats.score_breakdown.components).forEach(([key, component]) => {
                    checkNewPage(30);

                    // Component name and score
                    const componentText = `${component.label} (${Math.round(component.weight * 100)}%): ${component.score}/100`;
                    doc.setFont("Helvetica", "bold");
                    doc.text(componentText, marginX, cursorY);
                    cursorY += 12;

                    // Progress bar
                    const barWidth = 200;
                    const barHeight = 6;
                    const fillWidth = (component.score / 100) * barWidth;

                    // Background
                    doc.setFillColor(220, 220, 220);
                    doc.rect(marginX, cursorY, barWidth, barHeight, "F");

                    // Fill based on score
                    if (component.score >= 80) {
                        doc.setFillColor(16, 185, 129); // Green
                    } else if (component.score >= 50) {
                        doc.setFillColor(234, 179, 8); // Yellow
                    } else {
                        doc.setFillColor(239, 68, 68); // Red
                    }
                    doc.rect(marginX, cursorY, Math.max(fillWidth, 2), barHeight, "F");
                    cursorY += barHeight + 10;

                    // Component value
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

                // Recommendations from score breakdown
                if (stats.score_breakdown.recommendations && stats.score_breakdown.recommendations.length > 0) {
                    cursorY += 6;
                    checkNewPage(40);
                    doc.setFont("Helvetica", "bold");
                    doc.setFontSize(10);
                    doc.setTextColor(59, 130, 246); // Blue
                    doc.text("Personalized Recommendations:", marginX, cursorY);
                    cursorY += 14;

                    doc.setFont("Helvetica", "normal");
                    doc.setFontSize(9);
                    stats.score_breakdown.recommendations.forEach((rec) => {
                        checkNewPage(20);
                        const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth - 20);
                        recLines.forEach((line: string) => {
                            checkNewPage(12);
                            doc.text(line, marginX + 10, cursorY);
                            cursorY += 12;
                        });
                    });
                    cursorY += 10;
                    doc.setTextColor(0);
                }
            }

            // Consistency & Activity Metrics
            checkNewPage(80);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text("Consistency & Activity", marginX, cursorY);
            cursorY += 16;

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(10);
            const consistencyStats = [
                `Current Streak: ${stats.current_streak || 0} days`,
                `Max Streak: ${stats.max_streak || 0} days`,
                `Weekly Average Submissions: ${stats.avg_weekly_submissions || 0}`,
            ];

            consistencyStats.forEach((stat) => {
                checkNewPage(14);
                doc.text(stat, marginX, cursorY);
                cursorY += 14;
            });
            cursorY += 10;

            // Quality & Engagement
            checkNewPage(70);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Quality & Engagement", marginX, cursorY);
            cursorY += 16;

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(10);
            const qualityStats = [
                `Weighted Acceptance Rate: ${stats.weighted_acceptance_rate || 0}%`,
                `Community Engagement: ${stats.community_engagement || "Low"}`,
            ];

            qualityStats.forEach((stat) => {
                checkNewPage(14);
                doc.text(stat, marginX, cursorY);
                cursorY += 14;
            });
            cursorY += 10;

            // AI Insights
            if (result.analysis?.insights && result.analysis.insights.length > 0) {
                checkNewPage(60);
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(11);
                doc.setTextColor(139, 92, 246); // Primary color
                doc.text("AI Insights", marginX, cursorY);
                cursorY += 16;

                doc.setFont("Helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(0);
                result.analysis.insights.forEach((insight) => {
                    checkNewPage(20);
                    const insightLines = doc.splitTextToSize(`• ${insight}`, contentWidth - 20);
                    insightLines.forEach((line: string) => {
                        checkNewPage(12);
                        doc.text(line, marginX + 10, cursorY);
                        cursorY += 12;
                    });
                });
                cursorY += 10;
            }

            // AI Skill Analysis
            if (result.analysis) {
                checkNewPage(100);
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(11);
                doc.setTextColor(139, 92, 246); // Primary color
                doc.text(`AI Skill Analysis${result.analysis.estimated_level ? ` - ${result.analysis.estimated_level}` : ""}`, marginX, cursorY);
                cursorY += 16;

                // Summary
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

                // Strengths
                if (result.analysis.strengths && result.analysis.strengths.length > 0) {
                    checkNewPage(40);
                    doc.setFont("Helvetica", "bold");
                    doc.setFontSize(10);
                    doc.setTextColor(16, 185, 129); // Green
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

                // Recommendations
                if (result.analysis.recommendations && result.analysis.recommendations.length > 0) {
                    checkNewPage(40);
                    doc.setFont("Helvetica", "bold");
                    doc.setFontSize(10);
                    doc.setTextColor(59, 130, 246); // Blue
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

            // Add separator line between profiles
            if (index < filteredAndSortedResults.length - 1) {
                cursorY += 10;
                checkNewPage(20);
                doc.setDrawColor(220);
                doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
                cursorY += 20;
            }
        });

        // Add page number to last page
        addPageNumber();

        // Save the PDF
        doc.save(`leetcode-report-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    if (results.length === 0) {
        return (
            <div className="flex min-h-screen bg-background">
                <div className="print:hidden">
                    <DashboardSidebar type="company" />
                </div>

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-12">
                            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h2 className="text-2xl font-bold mb-2">No Analysis Data Available</h2>
                            <p className="text-muted-foreground mb-6">
                                Please analyze some LeetCode profiles first to generate a visual report.
                            </p>
                            <Button onClick={() => navigate("/company/leetcode-analysis")} className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Go to LeetCode Analysis
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <div className="print:hidden">
                <DashboardSidebar type="company" />
            </div>

            <main className="flex-1 p-8 print:p-0">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {/* Header */}
                    <div className="mb-8 print:hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                    <BarChart3 className="w-10 h-10 text-primary" />
                                    LeetCode Visual Report
                                </h1>
                                <p className="text-muted-foreground">
                                    Comprehensive analysis of {results.length} LeetCode profile{results.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => navigate("/company/leetcode-analysis")} variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Analysis
                                </Button>
                                <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </Button>
                                <Button onClick={() => window.print()} variant="outline" className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    Print
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active Only</SelectItem>
                                    <SelectItem value="inactive">Inactive Only</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="score_desc">Score (High to Low)</SelectItem>
                                    <SelectItem value="score_asc">Score (Low to High)</SelectItem>
                                    <SelectItem value="total_desc">Total Solved (High to Low)</SelectItem>
                                    <SelectItem value="total_asc">Total Solved (Low to High)</SelectItem>
                                    <SelectItem value="hard_desc">Hard Problems (High to Low)</SelectItem>
                                    <SelectItem value="streak_desc">Max Streak (High to Low)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Report Content */}
                    <div id="leetcode-report" className="space-y-6">
                        {/* Summary Statistics */}
                        <Card className="p-6 gradient-card shadow-soft">
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-primary" />
                                Summary Statistics
                            </h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="text-center p-6 bg-primary/10 rounded-lg">
                                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                                    <div className="text-3xl font-bold">{summaryStats.totalAnalyzed}</div>
                                    <div className="text-sm text-muted-foreground">Profiles Analyzed</div>
                                </div>
                                <div className="text-center p-6 bg-blue-500/10 rounded-lg">
                                    <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                    <div className="text-3xl font-bold">{summaryStats.avgScore}</div>
                                    <div className="text-sm text-muted-foreground">Average Score</div>
                                </div>
                                <div className="text-center p-6 bg-green-500/10 rounded-lg">
                                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                                    <div className="text-3xl font-bold">{summaryStats.avgSolved}</div>
                                    <div className="text-sm text-muted-foreground">Avg Problems Solved</div>
                                </div>
                                <div className="text-center p-6 bg-orange-500/10 rounded-lg">
                                    <Activity className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                                    <div className="text-3xl font-bold">{summaryStats.activePercentage}%</div>
                                    <div className="text-sm text-muted-foreground">Active Users</div>
                                </div>
                            </div>
                        </Card>

                        {/* Charts Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Difficulty Distribution */}
                            <Card className="p-6 gradient-card shadow-soft">
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-primary" />
                                    Problem Difficulty Distribution
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={difficultyDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) =>
                                                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {difficultyDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* Activity Status */}
                            <Card className="p-6 gradient-card shadow-soft">
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Activity Status
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={activityStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) =>
                                                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {activityStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* Score Distribution */}
                            <Card className="p-6 gradient-card shadow-soft">
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    Score Distribution
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={scoreDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill={COLORS.primary} name="Number of Candidates" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* Top Performers */}
                            <Card className="p-6 gradient-card shadow-soft">
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-primary" />
                                    Top 10 Performers
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={topPerformers} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="score" fill={COLORS.primary} name="Score" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>

                        {/* Individual Profile Cards */}
                        <Card className="p-6 gradient-card shadow-soft">
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                                <Users className="w-6 h-6 text-primary" />
                                Individual Profile Analysis ({filteredAndSortedResults.length})
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAndSortedResults.map((result, index) => {
                                    const stats = result.stats!;
                                    const scoreBreakdown = stats.score_breakdown;

                                    // Prepare radar chart data
                                    const radarData = scoreBreakdown
                                        ? Object.entries(scoreBreakdown.components).map(([key, value]) => ({
                                            subject: value.label.split(" ")[0], // Shortened label
                                            score: value.score,
                                            fullMark: 100,
                                        }))
                                        : [];

                                    return (
                                        <Card key={index} className="p-4 bg-card/50 hover:bg-card/80 transition-all">
                                            <div className="mb-4">
                                                <h4 className="font-semibold text-lg truncate">
                                                    {result.csv_name || result.username || "Unknown"}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div
                                                        className={`px-2 py-1 rounded text-xs font-medium ${stats.activity_status === "Active"
                                                            ? "bg-green-500/20 text-green-600"
                                                            : "bg-red-500/20 text-red-600"
                                                            }`}
                                                    >
                                                        {stats.activity_status || "Unknown"}
                                                    </div>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {stats.problem_solving_score || 0}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mini Bar Chart */}
                                            <div className="mb-4">
                                                <ResponsiveContainer width="100%" height={120}>
                                                    <BarChart
                                                        data={[
                                                            { name: "Easy", value: stats.easy_solved || 0, fill: COLORS.easy },
                                                            { name: "Medium", value: stats.medium_solved || 0, fill: COLORS.medium },
                                                            { name: "Hard", value: stats.hard_solved || 0, fill: COLORS.hard },
                                                        ]}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Bar dataKey="value">
                                                            {[
                                                                { fill: COLORS.easy },
                                                                { fill: COLORS.medium },
                                                                { fill: COLORS.hard },
                                                            ].map((entry, idx) => (
                                                                <Cell key={`cell-${idx}`} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Radar Chart */}
                                            {radarData.length > 0 && (
                                                <ResponsiveContainer width="100%" height={150}>
                                                    <RadarChart data={radarData}>
                                                        <PolarGrid />
                                                        <PolarAngleAxis dataKey="subject" />
                                                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                                        <Radar
                                                            name="Score"
                                                            dataKey="score"
                                                            stroke={COLORS.primary}
                                                            fill={COLORS.primary}
                                                            fillOpacity={0.6}
                                                        />
                                                        <Tooltip />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            )}

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                                                <div>
                                                    <div className="text-muted-foreground">Total Solved</div>
                                                    <div className="font-semibold">{stats.total_solved || 0}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Max Streak</div>
                                                    <div className="font-semibold">{stats.max_streak || 0} days</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Acceptance</div>
                                                    <div className="font-semibold">{stats.acceptance_rate || 0}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Ranking</div>
                                                    <div className="font-semibold">{stats.ranking?.toLocaleString() || "N/A"}</div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeetCodeReport;
