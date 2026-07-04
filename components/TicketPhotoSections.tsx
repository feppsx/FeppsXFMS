import Image from "next/image";
import type { TicketAttachment, AttachmentKind } from "@/lib/db-types";

const KIND_LABEL: Record<AttachmentKind, string> = {
  issue_photo:      "Issue photos (from requester)",
  progress_photo:   "Progress photos (from technician)",
  resolution_photo: "Resolution photos (proof of fix)",
  other:            "Other files",
};

const KIND_ORDER: AttachmentKind[] = [
  "issue_photo",
  "progress_photo",
  "resolution_photo",
  "other",
];

/**
 * Renders all ticket attachments grouped by kind. Empty groups are skipped so
 * the sidebar doesn't get littered with empty "Resolution photos" placeholders
 * before the technician has uploaded any.
 */
export function TicketPhotoSections({
  attachments,
  urls,
}: {
  attachments: TicketAttachment[];
  urls: Record<string, string>;
}) {
  const groups: Record<AttachmentKind, TicketAttachment[]> = {
    issue_photo: [], progress_photo: [], resolution_photo: [], other: [],
  };
  for (const a of attachments) groups[a.kind].push(a);

  const nonEmpty = KIND_ORDER.filter((k) => groups[k].length > 0);

  if (nonEmpty.length === 0) {
    return <p className="text-sm text-slate-500">No photos attached yet.</p>;
  }

  return (
    <div className="space-y-4">
      {nonEmpty.map((kind) => (
        <div key={kind}>
          <div className="text-xs font-medium text-slate-500 mb-1.5">
            {KIND_LABEL[kind]}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groups[kind].map((a) => {
              const url = urls[a.id];
              if (!url) return null;
              return (
                <a
                  key={a.id}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-square rounded-lg overflow-hidden border border-slate-200"
                >
                  <Image
                    src={url}
                    alt={a.file_name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
