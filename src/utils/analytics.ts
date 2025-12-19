import { MemberData, ChurnAnalytics, MonthLocationData } from "@/types/member";
import { getMonthYear, parseDate } from "./csvParser";

export const isNewMember = (member: MemberData): boolean => {
  // A member is considered "new" if they have only one purchase (first purchase)
  // and their purchase was within the last 30 days
  const purchaseDate = parseDate(member["Purchase Date"]);
  if (!purchaseDate) return false;
  
  const now = new Date();
  const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSincePurchase <= 30;
};

export const isFrozenMember = (member: MemberData): boolean => {
  const freezeCount = parseInt(member["Membership Freeze Count"]) || 0;
  const daysFrozen = parseInt(member["Days Frozen"]) || 0;
  return freezeCount > 0 || daysFrozen > 0;
};

export const isHighRiskMember = (member: MemberData): boolean => {
  // Only active members can be marked as high risk (not lapsed or renewed)
  if (member.Status !== "Active") return false;
  
  const attendanceRate = parseFloat(member["Attendance Rate %"]) || 0;
  const cancellationRate = parseFloat(member["Cancellation Rate %"]) || 0;
  const daysSinceLastVisit = parseInt(member["Days Since Last Visit"]) || 0;
  const noShows = parseInt(member["No Shows"]) || 0;
  
  // High risk indicators
  const lowAttendance = attendanceRate < 40;
  const highCancellation = cancellationRate > 40;
  const longAbsence = daysSinceLastVisit > 21;
  const frequentNoShows = noShows >= 3;
  
  // Count risk factors
  const riskFactors = [lowAttendance, highCancellation, longAbsence, frequentNoShows].filter(Boolean).length;
  
  return riskFactors >= 2;
};

export const getMemberTags = (member: MemberData): string[] => {
  const tags: string[] = [];
  
  if (isNewMember(member)) tags.push("new");
  if (isHighRiskMember(member)) tags.push("high-risk");
  if (member.Status === "Active" && !isHighRiskMember(member)) tags.push("active");
  if (member.Status === "Lapsed") tags.push("lapsed");
  
  return tags;
};

export const calculateAnalytics = (data: MemberData[]): ChurnAnalytics => {
  const totalMembers = data.length;
  const activeMembers = data.filter((m) => m.Status === "Active").length;
  const lapsedMembers = data.filter((m) => m.Status === "Lapsed").length;
  const newMembers = data.filter((m) => isNewMember(m)).length;
  const highRiskMembers = data.filter((m) => isHighRiskMember(m)).length;
  const frozenMembers = data.filter((m) => isFrozenMember(m)).length;
  const churnRate = totalMembers > 0 ? (lapsedMembers / totalMembers) * 100 : 0;

  const totalRevenue = data.reduce((sum, m) => {
    const amount = parseFloat(m["Amount Paid"]) || 0;
    return sum + amount;
  }, 0);

  const totalSessions = data.reduce((sum, m) => {
    const sessions = parseFloat(m["Total Sessions Completed"]) || 0;
    return sum + sessions;
  }, 0);

  const avgSessionsPerMember = totalMembers > 0 ? totalSessions / totalMembers : 0;
  const avgRevenuePerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;

  // Location breakdown with frozen members
  const locationBreakdown: Record<string, { active: number; lapsed: number; new: number; frozen: number }> = {};
  data.forEach((m) => {
    const location = m["Primary Location"] || "Unknown";
    if (!locationBreakdown[location]) {
      locationBreakdown[location] = { active: 0, lapsed: 0, new: 0, frozen: 0 };
    }
    if (m.Status === "Active") {
      locationBreakdown[location].active++;
    } else if (m.Status === "Lapsed") {
      locationBreakdown[location].lapsed++;
    }
    if (isNewMember(m)) {
      locationBreakdown[location].new++;
    }
    if (isFrozenMember(m)) {
      locationBreakdown[location].frozen++;
    }
  });

  // Monthly churn
  const monthlyChurn: Record<string, number> = {};
  data
    .filter((m) => m.Status === "Lapsed" && m["Churned Date"])
    .forEach((m) => {
      const monthYear = getMonthYear(m["Churned Date"]);
      monthlyChurn[monthYear] = (monthlyChurn[monthYear] || 0) + 1;
    });

  // Location monthly data with enhanced metrics
  const locationMonthlyData: Record<string, Record<string, MonthLocationData>> = {};
  
  data.forEach((m) => {
    const location = m["Primary Location"] || "Unknown";
    
    if (!locationMonthlyData[location]) {
      locationMonthlyData[location] = {};
    }
    
    const revenue = parseFloat(m["Amount Paid"]) || 0;
    const frozen = isFrozenMember(m) ? 1 : 0;
    
    // Get month from start date for new/active members
    if (m["Start Date"]) {
      const startMonth = getMonthYear(m["Start Date"]);
      if (!locationMonthlyData[location][startMonth]) {
        locationMonthlyData[location][startMonth] = { new: 0, active: 0, lapsed: 0, frozen: 0, churnRate: 0, revenue: 0 };
      }
      
      if (isNewMember(m)) {
        locationMonthlyData[location][startMonth].new++;
      }
      if (m.Status === "Active") {
        locationMonthlyData[location][startMonth].active++;
        locationMonthlyData[location][startMonth].revenue += revenue;
      }
      locationMonthlyData[location][startMonth].frozen += frozen;
    }
    
    // Get month from churned date for lapsed members
    if (m.Status === "Lapsed" && m["Churned Date"]) {
      const churnMonth = getMonthYear(m["Churned Date"]);
      if (!locationMonthlyData[location][churnMonth]) {
        locationMonthlyData[location][churnMonth] = { new: 0, active: 0, lapsed: 0, frozen: 0, churnRate: 0, revenue: 0 };
      }
      locationMonthlyData[location][churnMonth].lapsed++;
      locationMonthlyData[location][churnMonth].revenue += revenue;
    }
  });

  // Calculate churn rates for each location/month
  Object.keys(locationMonthlyData).forEach((location) => {
    Object.keys(locationMonthlyData[location]).forEach((month) => {
      const monthData = locationMonthlyData[location][month];
      const total = monthData.active + monthData.lapsed;
      monthData.churnRate = total > 0 ? (monthData.lapsed / total) * 100 : 0;
    });
  });

  return {
    totalMembers,
    activeMembers,
    lapsedMembers,
    newMembers,
    highRiskMembers,
    frozenMembers,
    churnRate,
    totalRevenue,
    avgSessionsPerMember,
    avgRevenuePerSession,
    locationBreakdown,
    monthlyChurn,
    locationMonthlyData,
  };
};

export const getUniqueValues = (
  data: MemberData[],
  key: keyof MemberData
): string[] => {
  const values = new Set<string>();
  data.forEach((m) => {
    const value = m[key];
    if (value && value.trim() !== "") {
      values.add(value);
    }
  });
  return Array.from(values).sort();
};

export const groupData = (
  data: MemberData[],
  groupKey: string
): Record<string, MemberData[]> => {
  const groups: Record<string, MemberData[]> = {};
  
  data.forEach((item) => {
    let key: string;
    
    if (groupKey === "churnMonth") {
      key = item.Status === "Lapsed" && item["Churned Date"]
        ? getMonthYear(item["Churned Date"])
        : "Not Churned";
    } else {
      key = (item[groupKey as keyof MemberData] as string) || "Unknown";
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  return groups;
};

export const getMemberJourney = (memberId: string, data: MemberData[]): MemberData[] => {
  return data
    .filter((m) => m["Member ID"] === memberId)
    .sort((a, b) => {
      const dateA = new Date(a["Start Date"]?.replace(",", "") || 0);
      const dateB = new Date(b["Start Date"]?.replace(",", "") || 0);
      return dateA.getTime() - dateB.getTime();
    });
};

export const getChurnReasons = (data: MemberData[]): Record<string, number> => {
  const reasons: Record<string, number> = {};
  
  data.filter((m) => m.Status === "Lapsed").forEach((m) => {
    const cancellationRate = parseFloat(m["Cancellation Rate %"]) || 0;
    const attendanceRate = parseFloat(m["Attendance Rate %"]) || 0;
    const daysSinceLastVisit = parseInt(m["Days Since Last Visit"]) || 0;
    
    let reason: string;
    
    if (cancellationRate > 50) {
      reason = "High Cancellation Rate";
    } else if (attendanceRate < 30) {
      reason = "Low Attendance";
    } else if (daysSinceLastVisit > 60) {
      reason = "Inactivity";
    } else {
      reason = "Membership Expired";
    }
    
    reasons[reason] = (reasons[reason] || 0) + 1;
  });
  
  return reasons;
};

export const filterByDateRange = (
  data: MemberData[],
  startDate: string,
  endDate: string
): MemberData[] => {
  if (!startDate && !endDate) return data;
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  return data.filter((m) => {
    const purchaseDate = parseDate(m["Purchase Date"]);
    if (!purchaseDate) return true;
    
    if (start && purchaseDate < start) return false;
    if (end && purchaseDate > end) return false;
    
    return true;
  });
};