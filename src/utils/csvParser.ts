import Papa from "papaparse";
import { MemberData } from "@/types/member";

// Column name mappings for flexible CSV header matching
const COLUMN_MAPPINGS: Record<string, string[]> = {
  "Member Name": ["Member Name", "Name", "Member", "Full Name", "Customer Name", "Client Name"],
  "Member ID": ["Member ID", "ID", "MemberID", "Customer ID", "Client ID"],
  "Host ID": ["Host ID", "HostID", "Host"],
  "Status": ["Status", "Member Status", "Account Status", "Membership Status"],
  "Membership Name": ["Membership Name", "Membership", "Plan", "Plan Name", "Subscription", "Package"],
  "Sessions Limit": ["Sessions Limit", "Session Limit", "Max Sessions", "Total Sessions"],
  "Purchase Date": ["Purchase Date", "Purchased", "Date Purchased", "Buy Date", "Order Date"],
  "Start Date": ["Start Date", "Started", "Begin Date", "Activation Date"],
  "End Date": ["End Date", "Ended", "Expiry Date", "Expiration Date", "Expire Date"],
  "Churned Date": ["Churned Date", "Churn Date", "Cancelled Date", "Cancellation Date", "Lapsed Date"],
  "Amount Paid": ["Amount Paid", "Amount", "Total Amount", "Payment", "Price", "Revenue", "Total Paid"],
  "Discount Code": ["Discount Code", "Promo Code", "Coupon", "Voucher"],
  "Discount Value": ["Discount Value", "Discount", "Discount Amount"],
  "Original Amount (Before Discount)": ["Original Amount (Before Discount)", "Original Amount", "Base Price"],
  "Sold By": ["Sold By", "Salesperson", "Agent", "Rep"],
  "Most Recent Visit Date": ["Most Recent Visit Date", "Last Visit", "Last Visit Date", "Recent Visit"],
  "First Visit Date": ["First Visit Date", "First Visit", "Initial Visit"],
  "Total Sessions Completed": ["Total Sessions Completed", "Sessions Completed", "Completed Sessions", "Sessions Used"],
  "Sessions Used %": ["Sessions Used %", "Session Usage", "Usage %", "Sessions Used Percentage"],
  "Remaining Sessions": ["Remaining Sessions", "Sessions Remaining", "Sessions Left"],
  "Total Cancellations": ["Total Cancellations", "Cancellations", "Cancelled Sessions"],
  "Late Cancellations": ["Late Cancellations", "Late Cancels", "Late Cancel Count"],
  "No Shows": ["No Shows", "NoShows", "No Show Count", "Missed Sessions"],
  "Cancellation Rate %": ["Cancellation Rate %", "Cancellation Rate", "Cancel Rate", "Cancellation %"],
  "Preferred Booking Method": ["Preferred Booking Method", "Booking Method", "Booking Preference"],
  "Primary Location": ["Primary Location", "Location", "Studio", "Branch", "Gym", "Center", "Centre"],
  "Locations Attended": ["Locations Attended", "Visited Locations", "Studios Visited"],
  "Membership Freeze Count": ["Membership Freeze Count", "Freeze Count", "Freezes", "Pauses"],
  "Days Frozen": ["Days Frozen", "Frozen Days", "Freeze Days"],
  "Membership Duration (Days)": ["Membership Duration (Days)", "Duration", "Duration Days", "Tenure"],
  "Days Active": ["Days Active", "Active Days", "Days Since Start"],
  "Days Since Last Visit": ["Days Since Last Visit", "Days Inactive", "Inactivity Days", "Last Visit Days Ago"],
  "Average Sessions Per Month": ["Average Sessions Per Month", "Avg Sessions", "Monthly Sessions", "Sessions/Month"],
  "Revenue Per Session": ["Revenue Per Session", "Rev/Session", "Session Value"],
  "Attendance Rate %": ["Attendance Rate %", "Attendance Rate", "Attendance %", "Attendance"],
  "Created By": ["Created By", "Creator", "Added By"],
};

// Find matching column name from CSV headers
const findMatchingColumn = (csvHeaders: string[], targetColumn: string): string | null => {
  const possibleNames = COLUMN_MAPPINGS[targetColumn] || [targetColumn];
  
  for (const header of csvHeaders) {
    const normalizedHeader = header.trim().toLowerCase();
    for (const possibleName of possibleNames) {
      if (normalizedHeader === possibleName.toLowerCase()) {
        return header;
      }
    }
  }
  return null;
};

// Normalize row data to expected column names
const normalizeRow = (row: Record<string, string>, csvHeaders: string[]): MemberData => {
  const normalizedRow: Record<string, string> = {};
  
  const expectedColumns = Object.keys(COLUMN_MAPPINGS);
  
  for (const expectedColumn of expectedColumns) {
    const actualColumn = findMatchingColumn(csvHeaders, expectedColumn);
    normalizedRow[expectedColumn] = actualColumn ? (row[actualColumn] || "") : "";
  }
  
  // Also copy any extra columns that might be present
  for (const key of Object.keys(row)) {
    if (!expectedColumns.some(col => findMatchingColumn([key], col) === key)) {
      normalizedRow[key] = row[key];
    }
  }
  
  return normalizedRow as MemberData;
};

export const parseCSV = (file: File): Promise<MemberData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          resolve([]);
          return;
        }
        
        // Get CSV headers from first row
        const csvHeaders = Object.keys(results.data[0] as Record<string, string>);
        
        // Normalize all rows
        const normalizedData = (results.data as Record<string, string>[]).map(row => 
          normalizeRow(row, csvHeaders)
        );
        
        resolve(normalizedData);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  
  // Handle format: "2025-10-31, 21:50:13"
  const cleanDate = dateStr.replace(",", "").trim();
  const parsed = new Date(cleanDate);
  
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Format currency with compact notation (L = Lakh, Cr = Crore, K = Thousand)
export const formatCurrencyCompact = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "₹0";
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  
  if (absNum >= 10000000) {
    // Crore (1 Cr = 10 million)
    return `${sign}₹${(absNum / 10000000).toFixed(2)}Cr`;
  } else if (absNum >= 100000) {
    // Lakh (1 L = 100 thousand)
    return `${sign}₹${(absNum / 100000).toFixed(2)}L`;
  } else if (absNum >= 1000) {
    // Thousand
    return `${sign}₹${(absNum / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${absNum.toFixed(0)}`;
};

export const formatNumber = (value: string | number, decimals = 1): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num.toFixed(decimals);
};

export const formatNumberCompact = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "0";
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  
  if (absNum >= 10000000) {
    return `${sign}${(absNum / 10000000).toFixed(2)}Cr`;
  } else if (absNum >= 100000) {
    return `${sign}${(absNum / 100000).toFixed(2)}L`;
  } else if (absNum >= 1000) {
    return `${sign}${(absNum / 1000).toFixed(1)}K`;
  }
  return `${sign}${absNum.toFixed(0)}`;
};

export const formatDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  if (!date) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getMonthYear = (dateStr: string): string => {
  const date = parseDate(dateStr);
  if (!date) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
