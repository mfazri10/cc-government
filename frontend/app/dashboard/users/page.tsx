import { Users } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { fetchUsers } from "@/features/auth/users-actions";

export default async function UsersPage() {
  let users;

  try {
    users = await fetchUsers();
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted mt-1">Kelola pengguna dan hak akses</p>
          </div>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-foreground font-medium">Gagal memuat data user</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan di port 8000.</p>
        </div>
      </div>
    );
  }

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
      </div>

      {users.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted text-sm">Belum ada user terdaftar.</p>
        </div>
      ) : (
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-card-hover transition-smooth">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r.id} variant="default">{r.name}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
