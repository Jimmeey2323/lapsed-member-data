export interface MemberData {
  "Member Name": string;
  "Member ID": string;
  "Host ID": string;
  Status: "Active" | "Lapsed" | string;
  "Membership Name": string;
  "Sessions Limit": string;
  "Purchase Date": string;
  "Start Date": string;
  "End Date": string;
  "Churned Date": string;
  "Amount Paid": string;
  "Discount Code": string;
  "Discount Value": string;
  "Original Amount (Before Discount)": string;
  "Sold By": string;
  "Created By": string;
  "Most Recent Visit Date": string;
  "First Visit Date": string;
  "Total Sessions Completed": string;
  "Sessions Used %": string;
  "Remaining Sessions": string;
  "Total Cancellations": string;
  "Late Cancellations": string;
  "No Shows": string;
  "Cancellation Rate %": string;
  "Preferred Booking Method": string;
  "Primary Location": string;
  "Locations Attended": string;
  "Membership Freeze Count": string;
  "Days Frozen": string;
  "Membership Duration (Days)": string;
  "Days Active": string;
  "Days Since Last Visit": string;
  "Average Sessions Per Month": string;
  "Revenue Per Session": string;
  "Attendance Rate %": string;
  [key: string]: string;
}

export interface FilterState {
  status: string[];
  location: string[];
  membershipName: string[];
  dateRange: {
    start: string;
    end: string;
  };
  searchQuery: string;
}

export interface GroupByOption {
  key: string;
  label: string;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

export interface MonthLocationData {
  new: number;
  active: number;
  lapsed: number;
  frozen: number;
  churnRate: number;
  revenue: number;
}

export interface ChurnAnalytics {
  totalMembers: number;
  activeMembers: number;
  lapsedMembers: number;
  newMembers: number;
  highRiskMembers: number;
  frozenMembers: number;
  churnRate: number;
  totalRevenue: number;
  avgSessionsPerMember: number;
  avgRevenuePerSession: number;
  locationBreakdown: Record<string, { active: number; lapsed: number; new: number; frozen: number }>;
  monthlyChurn: Record<string, number>;
  locationMonthlyData: Record<string, Record<string, MonthLocationData>>;
}

export interface DateRangePreset {
  label: string;
  days: number | null;
}

export type MemberTag = "new" | "high-risk" | "active" | "lapsed";