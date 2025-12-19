import { Layers, MapPin, Tag, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupByOption } from "@/types/member";

interface GroupBySelectorProps {
  activeGroup: string | null;
  onGroupChange: (group: string | null) => void;
}

const GROUP_OPTIONS: (GroupByOption & { icon: React.ElementType })[] = [
  { key: "Status", label: "Status", icon: Tag },
  { key: "Primary Location", label: "Location", icon: MapPin },
  { key: "Membership Name", label: "Membership", icon: Users },
  { key: "churnMonth", label: "Churn Month", icon: Calendar },
];

const GroupBySelector = ({
  activeGroup,
  onGroupChange,
}: GroupBySelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <Layers size={16} />
        Group by:
      </span>
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30">
        <Button
          variant={activeGroup === null ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onGroupChange(null)}
          className="h-8 px-3 text-xs"
        >
          None
        </Button>
        {GROUP_OPTIONS.map((option) => (
          <Button
            key={option.key}
            variant={activeGroup === option.key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onGroupChange(option.key)}
            className="h-8 px-3 text-xs gap-1"
          >
            <option.icon size={14} />
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GroupBySelector;
