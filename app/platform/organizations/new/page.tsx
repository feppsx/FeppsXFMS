import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateOrgForm } from "@/components/CreateOrgForm";

export const dynamic = "force-dynamic";

export default function NewOrgPage() {
  return (
    <div>
      <Link
        href="/platform/organizations"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to organizations
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">New organization</h1>
      <p className="text-sm text-slate-500 mb-6">
        Creates the org and its first admin user. Share the generated password with the customer.
      </p>
      <CreateOrgForm />
    </div>
  );
}
