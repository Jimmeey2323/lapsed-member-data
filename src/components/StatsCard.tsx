import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger" | "warning" | "info" | "neutral";
  delay?: number;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  variant = "default",
  delay = 0,
}: StatsCardProps) => {
  const variantStyles = {
    default: {
      iconBg: "bg-primary/10",
      icon: "text-primary",
      value: "text-foreground",
    },
    success: {
      iconBg: "bg-success/10",
      icon: "text-success",
      value: "text-success",
    },
    danger: {
      iconBg: "bg-destructive/10",
      icon: "text-destructive",
      value: "text-destructive",
    },
    warning: {
      iconBg: "bg-warning/10",
      icon: "text-warning",
      value: "text-warning",
    },
    info: {
      iconBg: "bg-info/10",
      icon: "text-info",
      value: "text-info",
    },
    neutral: {
      iconBg: "bg-muted",
      icon: "text-muted-foreground",
      value: "text-muted-foreground",
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className="bg-card border border-border rounded-lg p-3 hover:shadow-md hover:border-border/80 transition-all duration-200"
    >
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${styles.iconBg} flex-shrink-0`}>
          <Icon size={14} className={styles.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={`text-lg font-bold font-mono ${styles.value} truncate`}>
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;