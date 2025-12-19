import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, UserPlus, UserMinus, Pause, Percent, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { ChurnAnalytics, MonthLocationData } from "@/types/member";
import { formatCurrencyCompact, formatNumber } from "@/utils/csvParser";
import { Badge } from "@/components/ui/badge";

interface LocationMonthlyViewProps {
  analytics: ChurnAnalytics;
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

const LocationMonthlyView = ({ analytics }: LocationMonthlyViewProps) => {
  const { locationMonthlyData, locationBreakdown } = analytics;
  const [expandedMetric, setExpandedMetric] = useState<MetricKey | null>("active");

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

  const metrics: MetricConfig[] = [
    { key: "active", label: "Active Members", icon: Users, color: "text-success", bg: "bg-success/10" },
    { key: "lapsed", label: "Churned Members", icon: UserMinus, color: "text-destructive", bg: "bg-destructive/10" },
    { key: "churnRate", label: "Churn Rate", icon: Percent, color: "text-warning", bg: "bg-warning/10", isPercent: true },
    { key: "frozen", label: "Frozen", icon: Pause, color: "text-info", bg: "bg-info/10" },
    { key: "new", label: "New Members", icon: UserPlus, color: "text-new-member", bg: "bg-new-member/10" },
    { key: "revenue", label: "Revenue", icon: DollarSign, color: "text-primary", bg: "bg-primary/10", isCurrency: true },
  ];

  const formatValue = (value: number, metric: MetricConfig) => {
    if (metric.isCurrency) return formatCurrencyCompact(value);
    if (metric.isPercent) return `${formatNumber(value, 1)}%`;
    return formatNumber(value, 0);
  };

  const hasData = sortedMonths.length > 0 && sortedLocations.length > 0;

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-xl p-8 text-center"
      >
        <MapPin size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No location data available. Upload your member data to see location analytics.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Cards - 2 rows of 3 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className={`bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
              expandedMetric === metric.key ? "ring-2 ring-primary ring-offset-1" : ""
            }`}
            onClick={() => setExpandedMetric(expandedMetric === metric.key ? null : metric.key)}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-md ${metric.bg}`}>
                <metric.icon size={12} className={metric.color} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                {metric.label}
              </span>
            </div>
            <p className={`text-xl font-bold font-mono ${metric.color}`}>
              {formatValue(grandTotal[metric.key], metric)}
            </p>
          </div>
        ))}
      </div>

      {/* Collapsible Pivot Tables */}
      {metrics.map((metric) => (
        <div key={metric.key} className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setExpandedMetric(expandedMetric === metric.key ? null : metric.key)}
            className={`w-full px-4 py-2.5 flex items-center justify-between border-b border-border transition-colors ${
              expandedMetric === metric.key ? metric.bg : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <metric.icon size={14} className={metric.color} />
              <span className="text-sm font-semibold text-foreground">{metric.label} by Location</span>
              <Badge variant="secondary" className="font-mono text-[10px] h-5">
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
                  <tr className="bg-muted/40">
                    <th className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap border-r border-border/30 min-w-[160px] sticky left-0 bg-muted/40 z-10">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-primary" />
                        Location
                      </div>
                    </th>
                    {sortedMonths.map((month) => (
                      <th
                        key={month}
                        className="px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap border-r border-border/20 min-w-[80px]"
                      >
                        {month}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-bold text-primary whitespace-nowrap bg-primary/5 min-w-[80px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLocations.map((location, idx) => (
                    <tr
                      key={location}
                      className={`border-b border-border/20 hover:bg-accent/30 transition-colors ${
                        idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-foreground border-r border-border/30 whitespace-nowrap sticky left-0 bg-inherit z-10">
                        {location}
                      </td>
                      {sortedMonths.map((month) => {
                        const data = locationMonthlyData[location]?.[month];
                        const value = data ? data[metric.key] : 0;
                        return (
                          <td key={month} className="px-3 py-2 text-center border-r border-border/10">
                            <span className={`font-mono ${value > 0 ? metric.color : "text-muted-foreground/40"}`}>
                              {value > 0 ? formatValue(value, metric) : "–"}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center bg-primary/5">
                        <span className={`font-mono font-semibold ${metric.color}`}>
                          {formatValue(locationTotals[location][metric.key], metric)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-primary/10 border-t-2 border-primary/30 font-semibold">
                    <td className="px-3 py-2.5 text-primary font-bold border-r border-border/30 whitespace-nowrap sticky left-0 bg-primary/10 z-10">
                      TOTAL
                    </td>
                    {sortedMonths.map((month) => (
                      <td key={month} className="px-3 py-2.5 text-center border-r border-border/10">
                        <span className={`font-mono font-semibold ${metric.color}`}>
                          {formatValue(monthTotals[month][metric.key], metric)}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center bg-primary/20">
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
  );
};

export default LocationMonthlyView;