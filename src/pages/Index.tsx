import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  TrendingDown,
  DollarSign,
  Activity,
  UserPlus,
  AlertTriangle,
  Pause,
  UploadCloud,
} from "lucide-react";
import { MemberData, FilterState, ChurnAnalytics } from "@/types/member";
import { parseCSV } from "@/utils/csvParser";
import { calculateAnalytics, getUniqueValues, filterByDateRange } from "@/utils/analytics";
import { formatCurrencyCompact, formatNumber } from "@/utils/csvParser";

import FileUpload from "@/components/FileUpload";
import StatsCard from "@/components/StatsCard";
import FilterPanel from "@/components/FilterPanel";
import GroupBySelector from "@/components/GroupBySelector";
import DataTable from "@/components/DataTable";
import ViewTabs from "@/components/ViewTabs";
import ChurnAnalyticsPanel from "@/components/ChurnAnalyticsPanel";
import MemberJourneyList from "@/components/MemberJourneyList";
import LocationMonthlyView from "@/components/LocationMonthlyView";
import MonthOnMonthPanel from "@/components/MonthOnMonthPanel";

const Index = () => {
  const [data, setData] = useState<MemberData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Default to "location" view to show month-on-month table
  const [activeView, setActiveView] = useState<"table" | "analytics" | "journey" | "location" | "mom">("location");
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    location: [],
    membershipName: [],
    dateRange: { start: "", end: "" },
    searchQuery: "",
  });

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const parsedData = await parseCSV(file);
      setData(parsedData);
    } catch (error) {
      console.error("Error parsing CSV:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredData = useMemo(() => {
    let result = data;

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = filterByDateRange(result, filters.dateRange.start, filters.dateRange.end);
    }

    return result.filter((item) => {
      if (filters.status.length > 0 && !filters.status.includes(item.Status)) return false;
      if (filters.location.length > 0 && !filters.location.includes(item["Primary Location"])) return false;
      if (filters.membershipName.length > 0 && !filters.membershipName.includes(item["Membership Name"])) return false;

      if (filters.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        const searchableFields = [item["Member Name"], item["Member ID"], item["Primary Location"], item["Membership Name"]];
        if (!searchableFields.some((f) => f?.toLowerCase().includes(search))) return false;
      }

      return true;
    });
  }, [data, filters]);

  const analytics = useMemo<ChurnAnalytics>(() => calculateAnalytics(filteredData), [filteredData]);
  const availableStatuses = useMemo(() => getUniqueValues(data, "Status"), [data]);
  const availableLocations = useMemo(() => getUniqueValues(data, "Primary Location"), [data]);
  const availableMemberships = useMemo(() => getUniqueValues(data, "Membership Name"), [data]);

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Activity size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">Churn Analytics</h1>
                <p className="text-xs text-muted-foreground">Member retention insights</p>
              </div>
            </div>
            {data.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1.5 rounded-lg">
                  <span className="text-primary font-bold">{filteredData.length}</span>
                  <span className="mx-1">/</span>
                  <span>{data.length}</span>
                  <span className="ml-1.5 text-muted-foreground/70">records</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {data.length === 0 ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] space-y-8"
            >
              <div className="text-center space-y-4 max-w-lg">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-xl mb-6">
                  <UploadCloud size={36} className="text-primary-foreground" />
                </div>
                <h2 className="text-4xl font-bold text-foreground tracking-tight">
                  Member Churn Analytics
                </h2>
                <p className="text-muted-foreground text-lg">
                  Upload your membership data to discover actionable insights and reduce churn.
                </p>
              </div>
              <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Stats Cards - 2 rows of 4 */}
              <div className="grid grid-cols-4 gap-2">
                <StatsCard title="Total Members" value={analytics.totalMembers} icon={Users} delay={0} />
                <StatsCard title="Active" value={analytics.activeMembers} icon={UserCheck} variant="success" delay={0.03} />
                <StatsCard title="Lapsed" value={analytics.lapsedMembers} icon={UserX} variant="danger" delay={0.06} />
                <StatsCard title="New" value={analytics.newMembers} icon={UserPlus} variant="info" delay={0.09} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <StatsCard title="At Risk" value={analytics.highRiskMembers} icon={AlertTriangle} variant="warning" delay={0.12} />
                <StatsCard title="Frozen" value={analytics.frozenMembers} icon={Pause} variant="neutral" delay={0.15} />
                <StatsCard title="Churn Rate" value={`${formatNumber(analytics.churnRate, 1)}%`} icon={TrendingDown} variant="danger" delay={0.18} />
                <StatsCard title="Revenue" value={formatCurrencyCompact(analytics.totalRevenue)} icon={DollarSign} variant="success" delay={0.21} />
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <ViewTabs activeView={activeView} onViewChange={setActiveView} />
                  {activeView === "table" && <GroupBySelector activeGroup={groupBy} onGroupChange={setGroupBy} />}
                </div>
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableStatuses={availableStatuses}
                  availableLocations={availableLocations}
                  availableMemberships={availableMemberships}
                />
              </div>

              {/* Content Views */}
              <AnimatePresence mode="wait">
                {activeView === "table" && (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DataTable data={filteredData} groupBy={groupBy} allData={filteredData} />
                  </motion.div>
                )}
                {activeView === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChurnAnalyticsPanel analytics={analytics} />
                  </motion.div>
                )}
                {activeView === "mom" && (
                  <motion.div
                    key="mom"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MonthOnMonthPanel analytics={analytics} data={filteredData} />
                  </motion.div>
                )}
                {activeView === "journey" && (
                  <motion.div
                    key="journey"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MemberJourneyList data={filteredData} />
                  </motion.div>
                )}
                {activeView === "location" && (
                  <motion.div
                    key="location"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LocationMonthlyView analytics={analytics} data={filteredData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;