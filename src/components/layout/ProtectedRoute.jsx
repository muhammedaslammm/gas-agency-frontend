import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../modules/auth/auth.context";

function ProtectedRoute() {
  const { user, isLoading, authError, retrySessionCheck } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Checking your session...
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-gray-700">{authError}</p>

        <button
          type="button"
          onClick={retrySessionCheck}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
