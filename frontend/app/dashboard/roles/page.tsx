import { Shield, Check, X } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { fetchRoles, fetchPermissions } from "@/features/auth/roles-actions";

export default async function RolesPage() {
  let roles;
  let allPermissions;

  try {
    [roles, allPermissions] = await Promise.all([
      fetchRoles(),
      fetchPermissions(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Role & Permission Manager</h1>
            <p className="text-sm text-muted mt-1">Atur hak akses untuk setiap role</p>
          </div>
        </div>
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
          <p className="text-foreground font-medium">Gagal memuat data roles</p>
          <p className="text-sm text-muted mt-1">Pastikan backend API berjalan di port 8000.</p>
        </div>
      </div>
    );
  }

  // Build list of unique permission names from allPermissions
  const permissionNames = allPermissions.map((p) => p.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-accent-light" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Role & Permission Manager</h1>
          <p className="text-sm text-muted mt-1">Atur hak akses untuk setiap role</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted sticky left-0 bg-card z-10">
                Permission
              </th>
              {roles.map((r) => (
                <th key={r.id} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted">
                  {r.label || r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {permissionNames.map((perm) => (
              <tr key={perm} className="hover:bg-card-hover transition-smooth">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground sticky left-0 bg-card">
                  {perm}
                </td>
                {roles.map((r) => {
                  const hasPermission = r.permissions.some((p) => p.name === perm);
                  return (
                    <td key={`${r.id}-${perm}`} className="px-4 py-2.5 text-center">
                      {hasPermission ? (
                        <Check className="w-4 h-4 text-positive mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-muted/30 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
