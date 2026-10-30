import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  House,
  ShoppingCart,
  Users,
  Package,
  ArchiveBox,
  MapTrifold,
  SignOut,
} from "phosphor-react";
import { useAuth } from "../../modules/auth/auth.context";

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-stone-100 text-black"
        : "text-stone-600 hover:bg-stone-50 hover:text-gray-900"
    }`;

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="flex w-[230px] shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-6">
          <h1 className="text-xl font-semibold text-gray-900">Gas Agency</h1>
          <p className="text-sm text-gray-500">Management System</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1 p-3">
          <NavLink to="/" end className={navLinkClass}>
            <House size={18} weight="regular" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/sales" className={navLinkClass}>
            <ShoppingCart size={18} weight="regular" />
            <span>Sales</span>
          </NavLink>

          <NavLink to="/stocks" className={navLinkClass}>
            <ArchiveBox size={18} weight="regular" />
            <span>Stock Purchase</span>
          </NavLink>

          <NavLink to="/customers" className={navLinkClass}>
            <Users size={18} weight="regular" />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/products" className={navLinkClass}>
            <Package size={18} weight="regular" />
            <span>Products</span>
          </NavLink>

          <NavLink to="/routes" className={navLinkClass}>
            <MapTrifold size={18} weight="regular" />
            <span>Routes</span>
          </NavLink>
        </nav>

        <div className="border-t border-gray-200 p-4">
          {logoutError && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {logoutError}
            </p>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-2 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SignOut size={18} />
            <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* <header className="flex items-center border-b border-gray-200 bg-white px-4 py-4">
          <h2 className="text-sm font-medium text-gray-700">
            Gas Agency Management
          </h2>
        </header> */}

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
