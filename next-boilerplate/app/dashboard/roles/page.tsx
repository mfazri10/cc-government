import { Shield, Check, X } from "lucide-react";

const permissions = [
  "dashboard.view", "sentimen.view", "sentimen.manage",
  "feedback.view", "feedback.create", "feedback.delete",
  "entity.view", "entity.create", "entity.update", "entity.delete",
  "user.view", "user.create", "user.update", "user.delete",
  "analytics.view", "analytics.export",
];

const roles = [
  { name: "super_admin", label: "Super Admin", perms: permissions },
  { name: "admin", label: "Admin", perms: permissions.slice(0, 14) },
  { name: "operator", label: "Operator", perms: ["dashboard.view", "sentimen.view", "feedback.view", "feedback.create", "entity.view", "analytics.view"] },
  { name: "viewer", label: "Viewer", perms: ["dashboard.view", "sentimen.view", "feedback.view", "entity.view", "analytics.view", "analytics.export"] },
];

export default function RolesPage() {
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
                <th key={r.name} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {permissions.map((perm) => (
              <tr key={perm} className="hover:bg-card-hover transition-smooth">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground sticky left-0 bg-card">
                  {perm}
                </td>
                {roles.map((r) => (
                  <td key={`${r.name}-${perm}`} className="px-4 py-2.5 text-center">
                    {r.perms.includes(perm) ? (
                      <Check className="w-4 h-4 text-positive mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-muted/30 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
