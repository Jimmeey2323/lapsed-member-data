import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MapPin, TrendingDown, Activity, DollarSign } from "lucide-react";
import { MemberData } from "@/types/member";
import { getMemberJourney, getChurnReasons } from "@/utils/analytics";
import { formatCurrency, formatDate, formatNumber } from "@/utils/csvParser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MemberJourneyModalProps {
  memberId: string | null;
  allData: MemberData[];
  onClose: () => void;
}

const MemberJourneyModal = ({
  memberId,
  allData,
  onClose,
}: MemberJourneyModalProps) => {
  if (!memberId) return null;

  const journeyAsc = getMemberJourney(memberId, allData);
  // Reverse to show most recent first (descending)
  const journey = [...journeyAsc].reverse();
  if (journey.length === 0) return null;

  // Most recent membership for display
  const currentMember = journey[0];
  const totalSpent = journey.reduce(
    (sum, m) => sum + (parseFloat(m["Amount Paid"]) || 0),
    0
  );
  const totalSessions = journey.reduce(
    (sum, m) => sum + (parseFloat(m["Total Sessions Completed"]) || 0),
    0
  );

  const getChurnReason = (m: MemberData): string => {
    const cancellationRate = parseFloat(m["Cancellation Rate %"]) || 0;
    const attendanceRate = parseFloat(m["Attendance Rate %"]) || 0;
    const daysSinceLastVisit = parseInt(m["Days Since Last Visit"]) || 0;

    if (cancellationRate > 50) return "High Cancellation Rate";
    if (attendanceRate < 30) return "Low Attendance";
    if (daysSinceLastVisit > 60) return "Extended Inactivity";
    return "Membership Expired";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl glass-card shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {currentMember["Member Name"]}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono">ID: {currentMember["Member ID"]}</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {currentMember["Primary Location"]}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-border/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Memberships</p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {journey.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold font-mono text-success">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Sessions</p>
              <p className="text-2xl font-bold font-mono text-primary">
                {totalSessions}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              <Badge
                variant="outline"
                className={
                  currentMember.Status === "Active" ? "status-active" : "status-lapsed"
                }
              >
                {currentMember.Status}
              </Badge>
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="p-6 overflow-y-auto max-h-[400px] scrollbar-thin">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Membership Journey
            </h3>
            <div className="space-y-4">
              {journey.map((membership, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-8 pb-4 border-l-2 border-border last:border-l-transparent"
                >
                  <div
                    className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${
                      membership.Status === "Active"
                        ? "bg-success"
                        : "bg-destructive"
                    }`}
                  />
                  <div className="glass-card p-4 rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {membership["Membership Name"]}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(membership["Start Date"])} -{" "}
                            {formatDate(membership["End Date"])}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          membership.Status === "Active"
                            ? "status-active"
                            : "status-lapsed"
                        }
                      >
                        {membership.Status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-success" />
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-mono text-sm font-medium text-foreground">
                            {formatCurrency(membership["Amount Paid"])}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="font-mono text-sm font-medium text-foreground">
                            {membership["Total Sessions Completed"] || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown size={14} className="text-warning" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Attendance
                          </p>
                          <p className="font-mono text-sm font-medium text-foreground">
                            {formatNumber(membership["Attendance Rate %"])}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {membership.Status === "Lapsed" && (
                      <div className="pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-destructive font-medium">
                            Churn Reason:
                          </span>
                          <Badge variant="destructive" className="font-normal">
                            {getChurnReason(membership)}
                          </Badge>
                        </div>
                        {membership["Churned Date"] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Churned on {formatDate(membership["Churned Date"])}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MemberJourneyModal;
