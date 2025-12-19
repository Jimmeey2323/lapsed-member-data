import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { ChurnAnalytics, MemberData } from "@/types/member";
import { TrendingUp, TrendingDown, ArrowRight, Calendar } from "lucide-react";
import { useMemo } from "react";

interface MonthOnMonthPanelProps {
  analytics: ChurnAnalytics;
  data: MemberData[];
}

const COLORS = {
  primary: "hsl(250, 91%, 60%)",
  success: "hsl(152, 76%, 45%)",
  destructive: "hsl(0, 84%, 60%)",
  warning: "hsl(38, 92%, 50%)",
  purple: "hsl(280, 65%, 60%)",
  info: "hsl(199, 89%, 50%)",
};

const MonthOnMonthPanel = ({ analytics, data }: MonthOnMonthPanelProps) => {
  // Calculate month-on-month data - track first purchase per member for "new" count
  const monthlyData = useMemo(() => {
    const months: Record<string, { 
      newMembers: number; 
      lapsedMembers: number; 
      activeMembers: number;
      revenue: number;
      sessions: number;
      churnRate: number;
    }> = {};

    // Track which members have already been counted as "new" (first purchase only)
    const memberFirstPurchase: Record<string, string> = {};
    
    // First pass: find the earliest purchase date for each member
    data.forEach((member) => {
      const memberId = member["Member ID"];
      const startDate = member["Start Date"];
      if (startDate && memberId) {
        const date = new Date(startDate.replace(",", "").trim());
        if (!isNaN(date.getTime())) {
          const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          if (!memberFirstPurchase[memberId] || new Date(memberFirstPurchase[memberId]) > date) {
            memberFirstPurchase[memberId] = startDate;
          }
        }
      }
    });

    // Second pass: count new members only for their first purchase
    data.forEach((member) => {
      const memberId = member["Member ID"];
      const startDate = member["Start Date"];
      if (startDate) {
        const date = new Date(startDate.replace(",", "").trim());
        if (!isNaN(date.getTime())) {
          const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          if (!months[monthKey]) {
            months[monthKey] = { newMembers: 0, lapsedMembers: 0, activeMembers: 0, revenue: 0, sessions: 0, churnRate: 0 };
          }
          
          // Only count as new if this is their first purchase
          if (memberFirstPurchase[memberId] === startDate) {
            months[monthKey].newMembers++;
          }
          
          months[monthKey].revenue += parseFloat(member["Amount Paid"]) || 0;
          months[monthKey].sessions += parseInt(member["Total Sessions Completed"]) || 0;
        }
      }

      // Get churn month for lapsed members
      if (member.Status === "Lapsed" && member["Churned Date"]) {
        const date = new Date(member["Churned Date"].replace(",", "").trim());
        if (!isNaN(date.getTime())) {
          const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          if (!months[monthKey]) {
            months[monthKey] = { newMembers: 0, lapsedMembers: 0, activeMembers: 0, revenue: 0, sessions: 0, churnRate: 0 };
          }
          months[monthKey].lapsedMembers++;
        }
      }
    });

    // Calculate churn rate and active members for each month
    Object.keys(months).forEach((key) => {
      const total = months[key].newMembers + months[key].lapsedMembers;
      months[key].churnRate = total > 0 ? (months[key].lapsedMembers / total) * 100 : 0;
      months[key].activeMembers = months[key].newMembers - months[key].lapsedMembers;
    });

    // Sort by date
    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months
  }, [data]);

  // Calculate MoM changes
  const momChanges = useMemo(() => {
    if (monthlyData.length < 2) return null;
    
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    
    return {
      newMembers: previous.newMembers > 0 
        ? ((current.newMembers - previous.newMembers) / previous.newMembers) * 100 
        : 0,
      lapsedMembers: previous.lapsedMembers > 0 
        ? ((current.lapsedMembers - previous.lapsedMembers) / previous.lapsedMembers) * 100 
        : 0,
      revenue: previous.revenue > 0 
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
        : 0,
      churnRate: current.churnRate - previous.churnRate,
    };
  }, [monthlyData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 rounded-xl border border-border/50 shadow-elevated">
          <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}: <span className="font-mono font-medium text-foreground">{
                entry.name === "Revenue" ? `₹${(entry.value / 100000).toFixed(1)}L` :
                entry.name === "Churn Rate" ? `${entry.value.toFixed(1)}%` :
                entry.value
              }</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    isPositive,
    color 
  }: { 
    title: string; 
    value: string; 
    change?: number; 
    isPositive?: boolean;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/50"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="flex items-end justify-between">
        <h4 className="text-3xl font-bold font-display text-foreground">{value}</h4>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
            isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    </motion.div>
  );

  if (monthlyData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Monthly Data Available</h3>
        <p className="text-muted-foreground">Upload data with valid dates to see month-on-month analysis.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* MoM Summary Cards */}
      {momChanges && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="New Members"
            value={monthlyData[monthlyData.length - 1]?.newMembers.toString() || "0"}
            change={momChanges.newMembers}
            isPositive={momChanges.newMembers > 0}
            color={COLORS.success}
          />
          <MetricCard
            title="Churned Members"
            value={monthlyData[monthlyData.length - 1]?.lapsedMembers.toString() || "0"}
            change={momChanges.lapsedMembers}
            isPositive={momChanges.lapsedMembers < 0}
            color={COLORS.destructive}
          />
          <MetricCard
            title="Revenue"
            value={`₹${((monthlyData[monthlyData.length - 1]?.revenue || 0) / 100000).toFixed(1)}L`}
            change={momChanges.revenue}
            isPositive={momChanges.revenue > 0}
            color={COLORS.primary}
          />
          <MetricCard
            title="Churn Rate"
            value={`${(monthlyData[monthlyData.length - 1]?.churnRate || 0).toFixed(1)}%`}
            change={momChanges.churnRate}
            isPositive={momChanges.churnRate < 0}
            color={COLORS.warning}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New vs Churned Members */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground font-display">
              New vs Churned Members
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-success" />
                New
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                Churned
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.destructive} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.destructive} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="newMembers" 
                  name="New Members"
                  stroke={COLORS.success} 
                  fill="url(#newGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="lapsedMembers" 
                  name="Churned"
                  stroke={COLORS.destructive} 
                  fill="url(#churnGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Rate Trend */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 font-display">
            Churn Rate Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="churnRate" 
                  name="Churn Rate"
                  stroke={COLORS.warning} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.warning, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: COLORS.warning }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Trend */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 font-display">
          Monthly Revenue Trend
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={1}/>
                  <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                name="Revenue"
                fill="url(#revenueGradient)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground font-display">
            Monthly Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">New</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Churned</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Change</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Churn Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...monthlyData].reverse().map((row, index) => (
                <tr key={row.month} className="table-row-hover">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{row.month}</td>
                  <td className="px-6 py-4 text-sm text-right font-mono text-success">{row.newMembers}</td>
                  <td className="px-6 py-4 text-sm text-right font-mono text-destructive">{row.lapsedMembers}</td>
                  <td className="px-6 py-4 text-sm text-right font-mono">
                    <span className={row.activeMembers >= 0 ? "text-success" : "text-destructive"}>
                      {row.activeMembers >= 0 ? "+" : ""}{row.activeMembers}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono text-foreground">
                    ₹{(row.revenue / 100000).toFixed(2)}L
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.churnRate > 50 ? "bg-destructive/10 text-destructive" :
                      row.churnRate > 30 ? "bg-warning/10 text-warning" :
                      "bg-success/10 text-success"
                    }`}>
                      {row.churnRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default MonthOnMonthPanel;
