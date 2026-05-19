import { Users, Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";

const mockUsers = [
  { id: 1, name: "Super Admin", email: "admin@govmind.local", roles: ["super_admin"] },
  { id: 2, name: "Operator DPUPR", email: "operator.dpupr@cimahi.go.id", roles: ["operator"] },
  { id: 3, name: "Kepala Dinas Kesehatan", email: "kadis.kes@cimahi.go.id", roles: ["viewer"] },
  { id: 4, name: "Admin Disdukcapil", email: "admin.dukcapil@cimahi.go.id", roles: ["admin"] },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted mt-1">Kelola pengguna dan hak akses</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-smooth">
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Roles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {mockUsers.map((u) => (
              <tr key={u.id} className="hover:bg-card-hover transition-smooth">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="default">{r}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
