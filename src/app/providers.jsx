import { AuthProvider } from "../modules/auth/auth.context";

function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export default Providers;
