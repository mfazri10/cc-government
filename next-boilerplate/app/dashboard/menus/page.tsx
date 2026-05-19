import { Menu as MenuIcon, Plus, ChevronRight, Settings } from "lucide-react";

const mockMenus = [
  { id: 1, name: "Dashboard", route: "/dashboard", icon: "LayoutDashboard", parent_id: null, order_no: 1, children: [] },
  { id: 2, name: "Sentimen Warga", route: "/dashboard/sentimen", icon: "MessageSquare", parent_id: null, order_no: 2, children: [] },
  { id: 3, name: "Pengaduan", route: "/dashboard/pengaduan", icon: "AlertTriangle", parent_id: null, order_no: 3, children: [] },
  { id: 4, name: "Target Entities", route: "/dashboard/target-entities", icon: "Building2", parent_id: null, order_no: 4, children: [] },
  { 
    id: 5, name: "Pengaturan", route: null, icon: "Settings", parent_id: null, order_no: 5, 
    children: [
      { id: 6, name: "Manajemen User", route: "/dashboard/users", icon: "Users", parent_id: 5, order_no: 1, children: [] },
      { id: 7, name: "Manajemen Role", route: "/dashboard/roles", icon: "Shield", parent_id: 5, order_no: 2, children: [] },
      { id: 8, name: "Manajemen Menu", route: "/dashboard/menus", icon: "Menu", parent_id: 5, order_no: 3, children: [] },
    ]
  },
];

export default function MenusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MenuIcon className="w-5 h-5 text-accent-light" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Menu Management</h1>
            <p className="text-sm text-muted mt-1">Kelola struktur navigasi sidebar</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-smooth">
          <Plus className="w-4 h-4" /> Tambah Menu
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="space-y-2">
          {mockMenus.map((menu) => (
            <div key={menu.id} className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-card-hover border border-transparent hover:border-card-border transition-smooth cursor-pointer">
                <div className="flex items-center gap-3">
                  {menu.children.length > 0 ? (
                    <ChevronRight className="w-4 h-4 text-muted" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                  <span className="font-medium text-foreground">{menu.name}</span>
                  {menu.route && (
                    <span className="text-xs text-muted font-mono">{menu.route}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted">Order: {menu.order_no}</span>
                  <span className="text-xs text-accent-light bg-accent/10 px-2 py-0.5 rounded-full">{menu.icon}</span>
                </div>
              </div>
              
              {/* Children (1 level deep for demo) */}
              {menu.children.length > 0 && (
                <div className="pl-10 space-y-2">
                  {menu.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-card-hover border border-transparent hover:border-card-border transition-smooth cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground">{child.name}</span>
                        <span className="text-xs text-muted font-mono">{child.route}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted">Order: {child.order_no}</span>
                        <span className="text-xs text-accent-light bg-accent/10 px-2 py-0.5 rounded-full">{child.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
