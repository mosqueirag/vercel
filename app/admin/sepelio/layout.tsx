import AdminShell from "../admin-shell";

export default function SepelioAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
