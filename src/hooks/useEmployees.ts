import { useQuery } from "@tanstack/react-query";
import { getAuthToken, API_BASE } from "@/lib/api";

export interface Employee {
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

export const useEmployees = (team: string = "all") => {
    return useQuery({
        queryKey: ["employees", team],
        queryFn: async (): Promise<Employee[]> => {
            const token = getAuthToken();
            if (!token) throw new Error("No auth token");

            const url = team !== "all"
                ? `${API_BASE}/company/employees/?team=${team}`
                : `${API_BASE}/company/employees/`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch employees");
            }

            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
};
