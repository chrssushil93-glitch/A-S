import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { getSlots } from "@/lib/adminSlots";
import { storageMode } from "@/lib/adminStore";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const metadata: Metadata = { title: "Album console", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <main className="adm-wrap">
        <h1 className="adm-h1">Album console</h1>
        <p className="adm-note">
          The console is switched off until a password is set. Add an <code>ADMIN_PASSWORD</code> environment variable in
          your hosting settings (or <code>.env.local</code>), then reload this page.
        </p>
      </main>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;
  return <AdminConsole slots={getSlots()} mode={storageMode()} />;
}
