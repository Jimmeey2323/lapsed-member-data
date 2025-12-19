import { motion } from "framer-motion";
import {
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
} from "recharts";
import { ChurnAnalytics } from "@/types/member";

interface ChurnAnalyticsPanelProps {
  analytics: ChurnAnalytics;
}

const COLORS = {
  primary: "hsl(217, 91%, 60%)",
  success: "hsl(142, 76%, 45%)",
  destructive: "hsl(0, 84%, 60%)",
  warning: "hsl(38, 92%, 50%)",
  purple: "hsl(280, 65%, 60%)",
};

const ChurnAnalyticsPanel = ({ analytics }: ChurnAnalyticsPanelProps) => {
  const statusData = [
    { name: "Active", value: analytics.activeMembers, color: COLORS.success },
    { name: "Lapsed", value: analytics.lapsedMembers, color: COLORS.destructive },
  ];

  const locationData = Object.entries(analytics.locationBreakdown).map(
    ([location, data]) => ({
      location: location.split(",")[0].trim(),
      Active: data.active,
      Lapsed: data.lapsed,
    })
  );

  const monthlyChurnData = Object.entries(analytics.monthlyChurn)
    .map(([month, count]) => ({
      month,
      count,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg border border-border/50">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              <span style={{ color: entry.color || entry.fill }}>●</span>{" "}
              {entry.name}: <span className="font-mono">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Member Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-success">
                {analytics.activeMembers}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-destructive">
                {analytics.lapsedMembers}
              </p>
              <p className="text-sm text-muted-foreground">Lapsed</p>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Members by Location
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(215, 20%, 55%)" }} />
                <YAxis
                  type="category"
                  dataKey="location"
                  width={120}
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-muted-foreground">{value}</span>
                  )}
                />
                <Bar dataKey="Active" stackId="a" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Lapsed" stackId="a" fill={COLORS.destructive} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Churn Trend */}
      {monthlyChurnData.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Monthly Churn Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChurnData}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Lapsed Members"
                  fill={COLORS.destructive}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChurnAnalyticsPanel;
