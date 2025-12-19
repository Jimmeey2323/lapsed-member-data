import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { MemberData } from "@/types/member";
import { getMemberJourney } from "@/utils/analytics";
import { formatCurrency, formatDate } from "@/utils/csvParser";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MemberJourneyModal from "./MemberJourneyModal";

interface MemberJourneyListProps {
  data: MemberData[];
}

const MemberJourneyList = ({ data }: MemberJourneyListProps) => {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const uniqueMembers = useMemo(() => {
    const memberMap = new Map<string, MemberData[]>();
    data.forEach((m) => {
      const id = m["Member ID"];
      if (!memberMap.has(id)) {
        memberMap.set(id, []);
      }
      memberMap.get(id)!.push(m);
    });
    return Array.from(memberMap.entries()).map(([id, memberships]) => ({
      id,
      name: memberships[0]["Member Name"],
      memberships: memberships.sort((a, b) => {
        const dateA = new Date(a["Start Date"]?.replace(",", "") || 0);
        const dateB = new Date(b["Start Date"]?.replace(",", "") || 0);
        return dateB.getTime() - dateA.getTime();
      }),
      currentStatus: memberships[0].Status,
      location: memberships[0]["Primary Location"],
      totalSpent: memberships.reduce(
        (sum, m) => sum + (parseFloat(m["Amount Paid"]) || 0),
        0
      ),
      totalSessions: memberships.reduce(
        (sum, m) => sum + (parseFloat(m["Total Sessions Completed"]) || 0),
        0
      ),
    }));
  }, [data]);

  const filteredMembers = useMemo(() => {
    if (!search) return uniqueMembers;
    const searchLower = search.toLowerCase();
    return uniqueMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.id.includes(search) ||
        m.location.toLowerCase().includes(searchLower)
    );
  }, [uniqueMembers, search]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Member Journeys
            </h2>
            <p className="text-sm text-muted-foreground">
              Track individual member progression and churn patterns
            </p>
          </div>
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs bg-card/50 border-border/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setSelectedMember(member.id)}
              className="glass-card rounded-xl p-5 cursor-pointer hover:bg-muted/30 transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {member.id}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <MapPin size={14} />
                <span className="truncate">{member.location}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${
                      member.currentStatus === "Active"
                        ? "status-active"
                        : "status-lapsed"
                    }`}
                  >
                    {member.currentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-mono text-sm font-medium text-success mt-1">
                    {formatCurrency(member.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Memberships</p>
                  <p className="font-mono text-sm font-medium text-foreground mt-1">
                    {member.memberships.length}
                  </p>
                </div>
              </div>

              {member.memberships.length > 1 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    {member.currentStatus === "Active" ? (
                      <>
                        <TrendingUp size={14} className="text-success" />
                        <span className="text-success">Returning Member</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={14} className="text-destructive" />
                        <span className="text-destructive">
                          Previously Active
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No members found</p>
          </div>
        )}
      </div>

      <MemberJourneyModal
        memberId={selectedMember}
        allData={data}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
};

export default MemberJourneyList;
