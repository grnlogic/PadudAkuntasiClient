export interface EntriHarian {
  id: string;
  accountId: string;
  date: string;
  tanggal: string;
  nilai: number;
  description: string;
  createdBy: string;
  createdAt: string;
}

// ✅ Add separate type for create request
export interface CreateEntriHarianRequest {
  accountId: number;
  tanggal: string;
  nilai: number;
  description: string;
}