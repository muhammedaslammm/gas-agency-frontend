import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../modules/auth/LoginPage";
import DashboardPage from "../modules/dashboard/DashboardPage";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PublicOnlyRoute from "../components/layout/PublicOnlyRoute";
import SalesPage from "../modules/sales/SalesPage";
import CustomersPage from "../modules/customers/CustomerPage";
import ProductsPage from "../modules/products/ProductsPage";
import PurchasesPage from "../modules/purchases/PurchasesPage";
import RoutesPage from "../modules/routes/RoutesPage";
import CustomerDetailsPage from "../modules/customers/CustomerDetailsPage";
import CustomerCreatePage from "../modules/customers/CustomerCreatePage";
import PurchaseCreatePage from "../modules/purchases/PurchaseCreatePage";

const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <DashboardPage />,
          },
          {
            path: "/sales",
            element: <SalesPage />,
          },
          {
            path: "/customers",
            element: <CustomersPage />,
          },
          {
            path: "/customers/new",
            element: <CustomerCreatePage />,
          },
          {
            path: "/customers/:id",
            element: <CustomerDetailsPage />,
          },
          {
            path: "/products",
            element: <ProductsPage />,
          },
          {
            path: "/purchases/new",
            element: <PurchaseCreatePage />,
          },
          {
            path: "/purchases",
            element: <PurchasesPage />,
          },
          {
            path: "/routes",
            element: <RoutesPage />,
          },
        ],
      },
    ],
  },
]);

export default router;
