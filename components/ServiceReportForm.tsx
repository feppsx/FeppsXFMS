"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createServiceReport } from "@/lib/actions/service-reports";
import type { Estate } from "@/lib/db-types";
import { Loader2, ClipboardList } from "lucide-react";
import { ServiceReportDownloadButton } from "./ServiceReportDownloadButton";
import type { ServiceReportPdfInput } from "./ServiceReportPDF";

const SERVICES = [
  { key: "svc_electrical", label: "Electrical" },
  { key: "svc_plumbing", label: "Plumbing" },
  { key: "svc_generator", label: "Generator" },
  { key: "svc_pump", label: "Pump" },
  { key: "svc_fire_panel", label: "Fire Panel" },
  { key: "svc_intercom", label: "Intercom" },
  { key: "svc_cctv", label: "CCTV" },
  { key: "svc_lighting", label: "Lighting" },
  { key: "svc_auto_door", label: "Auto-Door" },
] as const;

type SvcKey = typeof SERVICES[number]["key"];

export function ServiceReportForm({
  estates,
}: {
  estates: Pick<Estate, "id" | "name" | "location" | "address" | "contact_phone">[];
}) {
  const [estateId, setEstateId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");

  const [isTermAgreement, setIsTermAgreement] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);
  const [isContract, setIsContract] = useState(false);
  const [isChargeable, setIsChargeable] = useState(false);

  const [svcFlags, setSvcFlags] = useState<Record<SvcKey, boolean>>({
    svc_electrical: false, svc_plumbing: false, svc_generator: false, svc_pump: false,
    svc_fire_panel: false, svc_intercom: false, svc_cctv: false, svc_lighting: false, svc_auto_door: false,
  });
  const [svcOthers, setSvcOthers] = useState("");

  const [workDescription, setWorkDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [serviceAttendedBy, setServiceAttendedBy] = useState("");
  const [dateAttended, setDateAttended] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<ServiceReportPdfInput | null>(null);

  function pickEstate(id: string) {
    setEstateId(id);
    const e = estates.find((x) => x.id === id);
    if (!e) return;
    if (!projectName) setProjectName(e.name);
    if (!serviceAddress) setServiceAddress([e.address, e.location].filter(Boolean).join(", "));
    if (!contactNo && e.contact_phone) setContactNo(e.contact_phone);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createServiceReport({
        client_id: estateId || null,
        project_name: projectName,
        service_address: serviceAddress,
        contact_person: contactPerson,
        contact_no: contactNo,
        is_term_agreement: isTermAgreement,
        is_on_call: isOnCall,
        is_contract: isContract,
        is_chargeable: isChargeable,
        ...svcFlags,
        svc_others: svcOthers,
        work_description: workDescription,
        recommendation: recommendation,
        customer_name: customerName,
        service_attended_by: serviceAttendedBy,
        date_attended: dateAttended,
        time_in: timeIn,
        time_out: timeOut,
      });
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(`Service report ${res.sr_no} saved`);
      setSaved({
        sr_no: res.sr_no!,
        project_name: projectName,
        service_address: serviceAddress || null,
        contact_person: contactPerson || null,
        contact_no: contactNo || null,
        is_term_agreement: isTermAgreement,
        is_on_call: isOnCall,
        is_contract: isContract,
        is_chargeable: isChargeable,
        ...svcFlags,
        svc_others: svcOthers || null,
        work_description: workDescription || null,
        recommendation: recommendation || null,
        customer_name: customerName || null,
        service_attended_by: serviceAttendedBy || null,
        date_attended: dateAttended || null,
        time_in: timeIn || null,
        time_out: timeOut || null,
      });
    });
  }

  if (saved) {
    return (
      <div className="text-center py-8">
        <ClipboardList className="w-12 h-12 text-brand mx-auto mb-3" />
        <h2 className="text-lg font-semibold">Service report saved</h2>
        <p className="text-sm text-slate-600 mt-1"><span className="font-mono font-semibold">{saved.sr_no}</span></p>
        <div className="mt-4 flex justify-center gap-2">
          <ServiceReportDownloadButton sr={saved} />
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            New report
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Estate (optional — auto-fills fields below)</label>
        <select value={estateId} onChange={(e) => pickEstate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white">
          <option value="">— Pick estate —</option>
          {estates.map((e) => (<option key={e.id} value={e.id}>{e.name} · {e.location}</option>))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name / Project *</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person</label>
          <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Service Address</label>
          <input value={serviceAddress} onChange={(e) => setServiceAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Contact No</label>
          <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-slate-200 rounded-lg p-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isTermAgreement} onChange={(e) => setIsTermAgreement(e.target.checked)} />
          Term Agreement / MCST
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isOnCall} onChange={(e) => setIsOnCall(e.target.checked)} />
          On Call / Site Visit
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isContract} onChange={(e) => setIsContract(e.target.checked)} />
          Contract
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isChargeable} onChange={(e) => setIsChargeable(e.target.checked)} />
          Chargeable
        </label>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Service Rendered (Routine / Complaints / Feedback)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 border border-slate-200 rounded-lg p-3">
          {SERVICES.map((s) => (
            <label key={s.key} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={svcFlags[s.key]}
                onChange={(e) => setSvcFlags((f) => ({ ...f, [s.key]: e.target.checked }))}
              />
              {s.label}
            </label>
          ))}
        </div>
        <input
          value={svcOthers}
          onChange={(e) => setSvcOthers(e.target.value)}
          placeholder="Others (specify)"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">Work Description</label>
        <textarea value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">Recommendation</label>
        <textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Service Attended By</label>
          <input value={serviceAttendedBy} onChange={(e) => setServiceAttendedBy(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date Attended</label>
          <input type="date" value={dateAttended} onChange={(e) => setDateAttended(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Time In</label>
            <input value={timeIn} onChange={(e) => setTimeIn(e.target.value)} placeholder="09:30" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Time Out</label>
            <input value={timeOut} onChange={(e) => setTimeOut(e.target.value)} placeholder="10:30" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit" disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
        Save service report
      </button>
    </form>
  );
}
