import Image from "next/image";
import type { TicketAttachment } from "@/lib/db-types";

/** Photo grid — takes attachments plus a resolved signed URL per attachment. */
export function TicketPhotos({
  attachments,
  urls,
}: {
  attachments: TicketAttachment[];
  urls: Record<string, string>;   // attachment.id -> signed URL
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">No photos attached.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {attachments.map((a) => {
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
  );
}
