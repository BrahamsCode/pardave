import { LogOut } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { getCurrentUser } from "@/lib/auth";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-mint-500 text-sm font-bold text-white">
        {user.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-white/55">{user.role === "ADMIN" ? "Administrador" : "Personal"}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
