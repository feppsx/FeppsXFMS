// Invite-only mode: public signup is closed. Anyone landing here is redirected
// to the login page with a note explaining that they need an invite.
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  redirect("/login?invite_only=1");
}
