// Mirrors the enums and row shapes defined in supabase/v2.sql.
// Later we'll auto-generate this from Supabase.

export type UserRole = "admin" | "technician" | "requester";

export type TicketStatus =
  | "submitted"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "resolved"
  | "closed"
  | "reopened"
  | "cancelled";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type AttachmentKind =
  | "issue_photo"
  | "progress_photo"
  | "resolution_photo"
  | "other";

export interface Client {
  id: string;
  name: string;              // e.g. "Wipro"
  location: string;          // e.g. "Chennai CDC5"
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** A tenant company at a multi-tenant client site (e.g. "Google" at Prestige Centre). */
export interface ClientTenant {
  id: string;
  client_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: string | null;
  client_id: string;
  tenant_id: string | null;
  specific_area: string | null;
  raised_by: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketStatusHistoryRow {
  id: string;
  ticket_id: string;
  from_status: TicketStatus | null;
  to_status: TicketStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  uploaded_by: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  kind: AttachmentKind;
  created_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  receipt_no: string;
  ticket_id: string;
  created_by: string | null;
  customer_name: string;
  customer_address: string | null;
  contact_no: string | null;
  invoice_date: string;   // YYYY-MM-DD
  time_in: string | null;
  time_out: string | null;
  subtotal: number;
  discount: number;
  gst_amount: number;
  deposit_amount: number;
  grand_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  unit_price: number;
  sort_order: number;
  created_at: string;
}
