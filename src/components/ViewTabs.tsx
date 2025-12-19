import { motion } from "framer-motion";
import { Table2, BarChart3, Users, MapPin, TrendingUp } from "lucide-react";

interface ViewTabsProps {
  activeView: "table" | "analytics" | "journey" | "location" | "mom";
  onViewChange: (view: "table" | "analytics" | "journey" | "location" | "mom") => void;
}

const TABS = [
  { key: "table", label: "Data Table", icon: Table2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "mom", label: "Month on Month", icon: TrendingUp },
  { key: "journey", label: "Member Journeys", icon: Users },
  { key: "location", label: "By Location", icon: MapPin },
] as const;

const ViewTabs = ({ activeView, onViewChange }: ViewTabsProps) => {
  return (
    <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm w-fit border border-border/50">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onViewChange(tab.key)}
          className={`
            relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            flex items-center gap-2
            ${
              activeView === tab.key
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }
          `}
        >
          {activeView === tab.key && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 gradient-primary rounded-xl shadow-glow"
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default ViewTabs;
