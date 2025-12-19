import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  DollarSign,
  BarChart3,
  Percent,
  Calendar,
  MapPin,
  AlertTriangle,
  Sparkles,
  Settings2,
  Download,
  Columns,
} from "lucide-react";
import { MemberData, SortState } from "@/types/member";
import { formatCurrencyCompact, formatDate, formatNumber } from "@/utils/csvParser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MemberJourneyModal from "./MemberJourneyModal";
import { isNewMember, isHighRiskMember } from "@/utils/analytics";

interface DataTableProps {
  data: MemberData[];
  groupBy: string | null;
  allData: MemberData[];
}

const COLUMNS = [
  { key: "Member Name", label: "Member", width: 160, icon: User },
  { key: "Status", label: "Status", width: 120, icon: Users },
  { key: "Membership Name", label: "Membership", width: 180, icon: Calendar },
  { key: "Primary Location", label: "Location", width: 150, icon: MapPin },
  { key: "Amount Paid", label: "Revenue", width: 90, isNumeric: true, icon: DollarSign },
  { key: "Total Sessions Completed", label: "Sessions", width: 80, isNumeric: true, icon: BarChart3 },
  { key: "Attendance Rate %", label: "Attend %", width: 80, isNumeric: true, icon: Percent },
  { key: "Cancellation Rate %", label: "Cancel %", width: 80, isNumeric: true, icon: Percent },
  { key: "Days Since Last Visit", label: "Days Out", width: 75, isNumeric: true, icon: Calendar },
  { key: "Start Date", label: "Started", width: 90, icon: Calendar },
  { key: "Churned Date", label: "Churned", width: 90, icon: Calendar },
];

const DataTable = ({ data, groupBy, allData }: DataTableProps) => {
  const [sort, setSort] = useState<SortState>({ column: "", direction: "asc" });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const tableMinWidth = useMemo(() => {
    const columnsWidth = COLUMNS.reduce((sum, col) => sum + col.width, 0);
    return groupBy ? columnsWidth + 40 : columnsWidth;
  }, [groupBy]);

  const handleSort = (column: string) => {
    if (sort.column === column) {
      setSort({
        column,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSort({ column, direction: "asc" });
    }
  };

  const sortedData = useMemo(() => {
    if (!sort.column) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.column as keyof MemberData] || "";
      const bVal = b[sort.column as keyof MemberData] || "";

      const aNum = parseFloat(aVal as string);
      const bNum = parseFloat(bVal as string);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sort.direction === "asc" ? aNum - bNum : bNum - aNum;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sort]);

  const groupedData = useMemo(() => {
    if (!groupBy) return { "All Members": sortedData };

    const groups: Record<string, MemberData[]> = {};
    sortedData.forEach((item) => {
      const key = (item[groupBy as keyof MemberData] as string) || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [sortedData, groupBy]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const calculateGroupTotals = (members: MemberData[]) => {
    const totalAmount = members.reduce(
      (sum, m) => sum + (parseFloat(m["Amount Paid"]) || 0),
      0
    );
    const totalSessions = members.reduce(
      (sum, m) => sum + (parseFloat(m["Total Sessions Completed"]) || 0),
      0
    );
    const avgAttendance =
      members.reduce(
        (sum, m) => sum + (parseFloat(m["Attendance Rate %"]) || 0),
        0
      ) / members.length || 0;
    const avgCancellation =
      members.reduce(
        (sum, m) => sum + (parseFloat(m["Cancellation Rate %"]) || 0),
        0
      ) / members.length || 0;

    return { totalAmount, totalSessions, avgAttendance, avgCancellation };
  };

  const renderMemberTags = (member: MemberData) => {
    const tags: React.ReactNode[] = [];

    if (isNewMember(member)) {
      tags.push(
        <Badge key="new" className="status-new text-[9px] h-4 px-1.5">
          <Sparkles size={8} className="mr-0.5" />
          New
        </Badge>
      );
    }

    if (isHighRiskMember(member)) {
      tags.push(
        <Badge key="risk" className="status-high-risk text-[9px] h-4 px-1.5">
          <AlertTriangle size={8} className="mr-0.5" />
          Risk
        </Badge>
      );
    }

    return tags;
  };

  const renderStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "status-active",
      Lapsed: "status-lapsed",
    };
    return (
      <Badge
        variant="outline"
        className={`text-[10px] h-5 px-2 font-semibold ${variants[status] || "status-pending"}`}
      >
        {status}
      </Badge>
    );
  };

  const renderCellValue = (row: MemberData, column: (typeof COLUMNS)[0]) => {
    const value = row[column.key as keyof MemberData];

    switch (column.key) {
      case "Status":
        return (
          <div className="flex items-center gap-1">
            {renderStatusBadge(value as string)}
            {renderMemberTags(row)}
          </div>
        );
      case "Amount Paid":
        return (
          <span className="font-mono text-xs font-semibold text-foreground">
            {formatCurrencyCompact(value as string)}
          </span>
        );
      case "Start Date":
      case "Churned Date":
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDate(value as string)}
          </span>
        );
      case "Attendance Rate %":
      case "Cancellation Rate %":
        const numVal = parseFloat(value as string) || 0;
        const colorClass =
          column.key === "Attendance Rate %"
            ? numVal >= 70
              ? "text-success"
              : numVal >= 40
              ? "text-warning"
              : "text-destructive"
            : numVal <= 20
            ? "text-success"
            : numVal <= 50
            ? "text-warning"
            : "text-destructive";
        return (
          <span className={`font-mono text-xs font-semibold ${colorClass}`}>
            {formatNumber(value as string, 0)}%
          </span>
        );
      case "Total Sessions Completed":
      case "Days Since Last Visit":
        return (
          <span className="font-mono text-xs text-foreground">
            {formatNumber(value as string, 0)}
          </span>
        );
      case "Member Name":
        return (
          <div className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border">
              <User size={11} className="text-primary" />
            </div>
            <span className="text-xs font-medium truncate max-w-[100px] whitespace-nowrap">
              {value as string}
            </span>
          </div>
        );
      case "Primary Location":
      case "Membership Name":
        return (
          <span
            className="text-xs text-muted-foreground truncate block whitespace-nowrap overflow-hidden"
            title={value as string}
          >
            {value as string}
          </span>
        );
      default:
        return (
          <span className="text-xs text-foreground truncate block">
            {value as string}
          </span>
        );
    }
  };

  const grandTotals = calculateGroupTotals(data);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        {/* Table Header Bar */}
        <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Member Data</span>
            <Badge variant="secondary" className="font-mono text-[10px] h-5 px-2">
              {data.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2 text-muted-foreground hover:text-foreground">
              <Columns size={12} />
              Columns
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 px-2 text-muted-foreground hover:text-foreground">
              <Download size={12} />
              Export
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
              <Settings2 size={12} />
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse table-fixed" style={{ minWidth: tableMinWidth }}>
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {groupBy && (
                  <th className="w-10 px-2 h-[35px]" />
                )}
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 h-[35px] text-left cursor-pointer hover:bg-muted/70 transition-colors"
                    style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <column.icon size={11} className="text-primary/70 flex-shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {column.label}
                      </span>
                      <span className="flex-shrink-0">
                        {sort.column === column.key ? (
                          sort.direction === "asc" ? (
                            <ArrowUp size={10} className="text-primary" />
                          ) : (
                            <ArrowDown size={10} className="text-primary" />
                          )
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([groupKey, members]) => (
                <>
                  {groupBy && (
                    <tr
                      key={`group-${groupKey}`}
                      className="bg-accent/50 hover:bg-accent/70 cursor-pointer transition-colors border-b border-border/50"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <td className="w-10 px-2 h-[35px]">
                        {expandedGroups.has(groupKey) ? (
                          <ChevronDown size={14} className="text-primary" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground" />
                        )}
                      </td>
                      <td colSpan={4} className="px-3 h-[35px]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{groupKey}</span>
                          <Badge variant="secondary" className="font-mono text-[10px] h-4 px-1.5">
                            {members.length}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 h-[35px] font-mono text-xs font-semibold text-foreground">
                        {formatCurrencyCompact(calculateGroupTotals(members).totalAmount)}
                      </td>
                      <td className="px-3 h-[35px] font-mono text-xs text-foreground">
                        {calculateGroupTotals(members).totalSessions}
                      </td>
                      <td className="px-3 h-[35px] font-mono text-xs text-foreground">
                        {formatNumber(calculateGroupTotals(members).avgAttendance, 0)}%
                      </td>
                      <td className="px-3 h-[35px] font-mono text-xs text-foreground">
                        {formatNumber(calculateGroupTotals(members).avgCancellation, 0)}%
                      </td>
                      <td colSpan={2} />
                    </tr>
                  )}
                  {(!groupBy || expandedGroups.has(groupKey)) &&
                    members.map((row, idx) => (
                      <tr
                        key={`${row["Member ID"]}-${idx}`}
                        className={`border-b border-border/30 transition-colors hover:bg-accent/30 cursor-pointer ${
                          idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                        }`}
                        onClick={() => setSelectedMember(row["Member ID"])}
                      >
                        {groupBy && <td className="w-10 px-2 h-[35px]" />}
                        {COLUMNS.map((column) => (
                          <td
                            key={column.key}
                            className="px-3 h-[35px] overflow-hidden"
                            style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
                          >
                            {renderCellValue(row, column)}
                          </td>
                        ))}
                      </tr>
                    ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-primary" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-mono font-semibold text-foreground">{data.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign size={12} className="text-success" />
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-mono font-semibold text-success">{formatCurrencyCompact(grandTotals.totalAmount)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 size={12} className="text-info" />
                <span className="text-muted-foreground">Sessions:</span>
                <span className="font-mono font-semibold text-foreground">{grandTotals.totalSessions}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Avg Attend:</span>
                <span className="font-mono font-semibold text-foreground">{formatNumber(grandTotals.avgAttendance, 0)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Avg Cancel:</span>
                <span className="font-mono font-semibold text-foreground">{formatNumber(grandTotals.avgCancellation, 0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <MemberJourneyModal
        memberId={selectedMember}
        allData={allData}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
};

export default DataTable;