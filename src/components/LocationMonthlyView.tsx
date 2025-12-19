import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, UserPlus, UserMinus, Pause, Percent, DollarSign, ChevronDown, ChevronUp, X } from "lucide-react";
import { ChurnAnalytics, MonthLocationData, MemberData } from "@/types/member";
import { formatCurrencyCompact, formatNumber } from "@/utils/csvParser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MemberJourneyModal from "./MemberJourneyModal";

interface LocationMonthlyViewProps {
  analytics: ChurnAnalytics;
  data: MemberData[];
}

type MetricKey = "active" | "lapsed" | "churnRate" | "frozen" | "new" | "revenue";

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: typeof Users;
  color: string;
  bg: string;
  isPercent?: boolean;
  isCurrency?: boolean;
}

interface DrillDownState {
  location: string;
  month: string;
  metric: MetricKey;
}

const LocationMonthlyView = ({ analytics, data }: LocationMonthlyViewProps) => {
  const { locationMonthlyData, locationBreakdown } = analytics;
  const [expandedMetric, setExpandedMetric] = useState<MetricKey | null>("active");
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Get all unique months sorted in descending order
  const sortedMonths = useMemo(() => {
    const allMonths = new Set<string>();
    Object.values(locationMonthlyData).forEach((months) => {
      Object.keys(months).forEach((month) => allMonths.add(month));
    });
    return Array.from(allMonths).sort((a, b) => {
      const dateA = new Date(a + " 1");
      const dateB = new Date(b + " 1");
      return dateB.getTime() - dateA.getTime();
    });
  }, [locationMonthlyData]);

  const sortedLocations = useMemo(() => {
    return Object.keys(locationBreakdown).sort();
  }, [locationBreakdown]);

  // Calculate totals per month
  const monthTotals = useMemo(() => {
    const totals: Record<string, MonthLocationData> = {};
    sortedMonths.forEach((month) => {
      totals[month] = { new: 0, active: 0, lapsed: 0, frozen: 0, churnRate: 0, revenue: 0 };
      sortedLocations.forEach((location) => {
        const data = locationMonthlyData[location]?.[month];
        if (data) {
          totals[month].new += data.new;
          totals[month].active += data.active;
          totals[month].lapsed += data.lapsed;
          totals[month].frozen += data.frozen;
          totals[month].revenue += data.revenue;
        }
      });
      const total = totals[month].active + totals[month].lapsed;
      totals[month].churnRate = total > 0 ? (totals[month].lapsed / total) * 100 : 0;
    });
    return totals;
  }, [sortedMonths, sortedLocations, locationMonthlyData]);

  // Calculate totals per location
  const locationTotals = useMemo(() => {
    const totals: Record<string, MonthLocationData> = {};
    sortedLocations.forEach((location) => {
      totals[location] = { new: 0, active: 0, lapsed: 0, frozen: 0, churnRate: 0, revenue: 0 };
      sortedMonths.forEach((month) => {
        const data = locationMonthlyData[location]?.[month];
        if (data) {
          totals[location].new += data.new;
          totals[location].active += data.active;
          totals[location].lapsed += data.lapsed;
          totals[location].frozen += data.frozen;
          totals[location].revenue += data.revenue;
        }
      });
      const total = totals[location].active + totals[location].lapsed;
      totals[location].churnRate = total > 0 ? (totals[location].lapsed / total) * 100 : 0;
    });
    return totals;
  }, [sortedMonths, sortedLocations, locationMonthlyData]);

  // Grand total
  const grandTotal = useMemo(() => {
    const total: MonthLocationData = { new: 0, active: 0, lapsed: 0, frozen: 0, churnRate: 0, revenue: 0 };
    Object.values(locationTotals).forEach((loc) => {
      total.new += loc.new;
      total.active += loc.active;
      total.lapsed += loc.lapsed;
      total.frozen += loc.frozen;
      total.revenue += loc.revenue;
    });
    const sum = total.active + total.lapsed;
    total.churnRate = sum > 0 ? (total.lapsed / sum) * 100 : 0;
    return total;
  }, [locationTotals]);

  // Get drill down members
  const drillDownMembers = useMemo(() => {
    if (!drillDown) return [];
    
    const { location, month, metric } = drillDown;
    
    return data.filter((member) => {
      const memberLocation = member["Primary Location"] || "Unknown";
      if (memberLocation !== location) return false;
      
      // Check based on metric type
      const startDate = member["Start Date"];
      const churnDate = member["Churned Date"];
      
      const getMonthKey = (dateStr: string) => {
        const date = new Date(dateStr.replace(",", "").trim());
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      };
      
      switch (metric) {
        case "active":
          return startDate && getMonthKey(startDate) === month && member.Status === "Active";
        case "lapsed":
          return churnDate && getMonthKey(churnDate) === month && member.Status === "Lapsed";
        case "new":
          return startDate && getMonthKey(startDate) === month;
        case "frozen":
          const freezeCount = parseInt(member["Membership Freeze Count"]) || 0;
          const daysFrozen = parseInt(member["Days Frozen"]) || 0;
          return startDate && getMonthKey(startDate) === month && (freezeCount > 0 || daysFrozen > 0);
        case "revenue":
          return startDate && getMonthKey(startDate) === month;
        default:
          return false;
      }
    });
  }, [drillDown, data]);

  const metrics: MetricConfig[] = [
    { key: "active", label: "Active", icon: Users, color: "text-success", bg: "bg-success/10" },
    { key: "lapsed", label: "Churned", icon: UserMinus, color: "text-destructive", bg: "bg-destructive/10" },
    { key: "churnRate", label: "Churn %", icon: Percent, color: "text-warning", bg: "bg-warning/10", isPercent: true },
    { key: "frozen", label: "Frozen", icon: Pause, color: "text-info", bg: "bg-info/10" },
    { key: "new", label: "New", icon: UserPlus, color: "text-new-member", bg: "bg-new-member/10" },
    { key: "revenue", label: "Revenue", icon: DollarSign, color: "text-primary", bg: "bg-primary/10", isCurrency: true },
  ];

  const formatValue = (value: number, metric: MetricConfig) => {
    if (metric.isCurrency) return formatCurrencyCompact(value);
    if (metric.isPercent) return `${formatNumber(value, 1)}%`;
    return formatNumber(value, 0);
  };

  const handleCellClick = (location: string, month: string, metric: MetricKey) => {
    if (metric === "churnRate") return; // Can't drill down into rates
    setDrillDown({ location, month, metric });
  };

  const hasData = sortedMonths.length > 0 && sortedLocations.length > 0;

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-lg p-8 text-center"
      >
        <MapPin size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No location data available. Upload your member data to see location analytics.</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Summary Cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className={`bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${
                expandedMetric === metric.key ? "ring-1 ring-primary border-primary" : ""
              }`}
              onClick={() => setExpandedMetric(expandedMetric === metric.key ? null : metric.key)}
            >
              <div className="flex items-center gap-2 mb-1">
                <metric.icon size={12} className={metric.color} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {metric.label}
                </span>
              </div>
              <p className={`text-lg font-bold font-mono ${metric.color}`}>
                {formatValue(grandTotal[metric.key], metric)}
              </p>
            </div>
          ))}
        </div>

        {/* Collapsible Pivot Tables */}
        {metrics.map((metric) => (
          <div key={metric.key} className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedMetric(expandedMetric === metric.key ? null : metric.key)}
              className={`w-full px-4 py-2.5 flex items-center justify-between border-b border-border transition-colors ${
                expandedMetric === metric.key ? "bg-muted/50" : "bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <metric.icon size={14} className={metric.color} />
                <span className="text-sm font-semibold text-foreground">{metric.label} by Location</span>
                <Badge variant="outline" className="font-mono text-[10px] h-5 border-border">
                  {formatValue(grandTotal[metric.key], metric)}
                </Badge>
              </div>
              {expandedMetric === metric.key ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </button>

            {/* Table */}
            {expandedMetric === metric.key && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-x-auto scrollbar-thin"
              >
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 h-[35px] text-left font-semibold text-foreground whitespace-nowrap border-r border-border/50 min-w-[160px] sticky left-0 bg-muted/30 z-10">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={11} className="text-muted-foreground" />
                          Location
                        </div>
                      </th>
                      {sortedMonths.map((month) => (
                        <th
                          key={month}
                          className="px-3 h-[35px] text-center font-semibold text-foreground whitespace-nowrap border-r border-border/20 min-w-[80px]"
                        >
                          {month}
                        </th>
                      ))}
                      <th className="px-3 h-[35px] text-center font-bold text-foreground whitespace-nowrap bg-muted/50 min-w-[80px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLocations.map((location, idx) => (
                      <tr
                        key={location}
                        className={`border-b border-border/20 hover:bg-muted/20 transition-colors ${
                          idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                        }`}
                      >
                        <td className="px-3 h-[35px] font-medium text-foreground border-r border-border/50 whitespace-nowrap sticky left-0 bg-inherit z-10">
                          {location}
                        </td>
                        {sortedMonths.map((month) => {
                          const cellData = locationMonthlyData[location]?.[month];
                          const value = cellData ? cellData[metric.key] : 0;
                          const isClickable = metric.key !== "churnRate" && value > 0;
                          return (
                            <td 
                              key={month} 
                              className={`px-3 h-[35px] text-center border-r border-border/10 ${isClickable ? "cursor-pointer hover:bg-primary/10" : ""}`}
                              onClick={() => isClickable && handleCellClick(location, month, metric.key)}
                            >
                              <span className={`font-mono ${value > 0 ? metric.color : "text-muted-foreground/40"}`}>
                                {value > 0 ? formatValue(value, metric) : "–"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 h-[35px] text-center bg-muted/30">
                          <span className={`font-mono font-semibold ${metric.color}`}>
                            {formatValue(locationTotals[location][metric.key], metric)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-muted/50 border-t border-border font-semibold">
                      <td className="px-3 h-[35px] text-foreground font-bold border-r border-border/50 whitespace-nowrap sticky left-0 bg-muted/50 z-10">
                        TOTAL
                      </td>
                      {sortedMonths.map((month) => (
                        <td key={month} className="px-3 h-[35px] text-center border-r border-border/10">
                          <span className={`font-mono font-semibold ${metric.color}`}>
                            {formatValue(monthTotals[month][metric.key], metric)}
                          </span>
                        </td>
                      ))}
                      <td className="px-3 h-[35px] text-center bg-muted/60">
                        <span className={`font-mono font-bold ${metric.color}`}>
                          {formatValue(grandTotal[metric.key], metric)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Drill Down Modal */}
      {drillDown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDrillDown(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-lg shadow-elevated max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span className="font-semibold text-foreground">{drillDown.location}</span>
                <Badge variant="outline" className="font-mono text-xs">{drillDown.month}</Badge>
                <Badge className="text-xs capitalize">{drillDown.metric}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDrillDown(null)}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="overflow-auto max-h-[calc(80vh-60px)]">
              {drillDownMembers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No members found for this selection.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 sticky top-0">
                    <tr>
                      <th className="px-3 h-[35px] text-left font-semibold text-foreground">Member</th>
                      <th className="px-3 h-[35px] text-left font-semibold text-foreground">Status</th>
                      <th className="px-3 h-[35px] text-left font-semibold text-foreground">Membership</th>
                      <th className="px-3 h-[35px] text-right font-semibold text-foreground">Revenue</th>
                      <th className="px-3 h-[35px] text-right font-semibold text-foreground">Sessions</th>
                      <th className="px-3 h-[35px] text-right font-semibold text-foreground">Attend %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillDownMembers.map((member, idx) => (
                      <tr 
                        key={`${member["Member ID"]}-${idx}`}
                        className={`border-b border-border/20 hover:bg-muted/20 cursor-pointer ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                        onClick={() => setSelectedMember(member["Member ID"])}
                      >
                        <td className="px-3 h-[35px] font-medium text-foreground">{member["Member Name"]}</td>
                        <td className="px-3 h-[35px]">
                          <Badge variant="outline" className={`text-[10px] ${member.Status === "Active" ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
                            {member.Status}
                          </Badge>
                        </td>
                        <td className="px-3 h-[35px] text-muted-foreground">{member["Membership Name"]}</td>
                        <td className="px-3 h-[35px] text-right font-mono text-foreground">{formatCurrencyCompact(member["Amount Paid"])}</td>
                        <td className="px-3 h-[35px] text-right font-mono text-foreground">{member["Total Sessions Completed"]}</td>
                        <td className="px-3 h-[35px] text-right font-mono text-foreground">{formatNumber(member["Attendance Rate %"], 0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      <MemberJourneyModal
        memberId={selectedMember}
        allData={data}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
};

export default LocationMonthlyView;