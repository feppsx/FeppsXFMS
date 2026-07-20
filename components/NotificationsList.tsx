import Link from "next/link";
import type { NotifItem } from "@/lib/notifications-data";
import { Bell, CheckCircle2, MessageSquare, UserPlus } from "lucide-react";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-SG", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const ICON = {
  status: CheckCircle2,
  assignment: UserPlus,
  feedback: MessageSquare,
};
const TONE = {
  status: "bg-brand-blue/10 text-brand-blue",
  assignment: "bg-emerald-100 text-emerald-700",
  feedback: "bg-amber-100 text-amber-800",
};

export function NotificationsList({ items, hrefPrefix }: { items: NotifItem[]; hrefPrefix?: string }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No notifications yet.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((n) => {
        const Icon = ICON[n.kind];
        const href = n.href ? (hrefPrefix ? n.href.replace("/admin/tickets/", `${hrefPrefix}/`) : n.href) : "#";
        return (
          <li key={n.id}>
            <Link href={href} className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-3 hover:border-brand-blue shadow-card">
              <div className={"w-10 h-10 rounded-full flex items-center justify-center shrink-0 " + TONE[n.kind]}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-900 text-sm truncate">{n.headline}</div>
                {n.detail && <div className="text-xs text-slate-600 truncate mt-0.5">{n.detail}</div>}
                <div className="text-[11px] text-slate-400 mt-1">{fmt(n.when)}</div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
