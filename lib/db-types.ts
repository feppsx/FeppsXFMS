// Mirrors the schema in supabase/. See patches for evolution.
// UI/type naming uses "Estate" everywhere; the underlying DB table is still
// called `clients` (patch 11 chose the safer path — see patch header).

export type UserRole = "admin" | "technician" | "requester" | "manager";

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

/** Retail = shops. MCST = strata-titled buildings. SBS = single business site. */
export type EstateCategory = "Retail" | "MCST" | "SBS";

/**
 * A managed site (e.g. Wipro Chennai CDC5, Prestige Centre Singapore).
 * DB table: `clients`. Renamed to Estate in UI/types per Phase-1 refactor.
 */
export interface Estate {
  id: string;
  name: string;
  location: string;
  category: EstateCategory;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Kept as a legacy alias so any lingering `Client` imports still typecheck.
 *  New code should use `Estate`. */
export type Client = Estate;

/** A tenant/company inside a multi-tenant estate. DB table: `client_tenants`. */
export interface EstateTenant {
  id: string;
  client_id: string;   // DB column stays client_id
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type ClientTenant = EstateTenant;

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  signature_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
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
  client_id: string;   // DB column — represents the estate the ticket belongs to
  tenant_id: string | null;
  specific_area: string | null;
  raised_by: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  tracking_token: string | null;
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
  ticket_id: string | null;    // null when the invoice was raised manually
  client_id: string | null;    // set on manual invoices (the estate being billed)
  category: EstateCategory | null;   // Retail/MCST/SBS for reporting
  created_by: string | null;
  customer_name: string;
  customer_address: string | null;
  contact_no: string | null;
  invoice_date: string;
  time_in: string | null;
  time_out: string | null;
  subtotal: number;
  discount: number;
  gst_amount: number;
  deposit_amount: number;
  grand_total: number;
  notes: string | null;
  is_paid: boolean;
  paid_at: string | null;
  paid_by: string | null;
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
