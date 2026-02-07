export interface CategoryLine {
  category: string;
  name: string;
}

export interface MonthlyCategorySummaryEntry {
  month: string;
  monthName: string;
  displayMonth: string;
  totalsByCategory: Record<string, number>;
}
