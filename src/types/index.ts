export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // Formato: AAAA-MM-DD
  status: "paid" | "pending";
  category: string;
  transactionId?: string;
  paidAmount?: number;
}
