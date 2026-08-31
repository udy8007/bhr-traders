import { HashRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./lib/auth.jsx";
import { AdminLayout } from "./layout/AdminLayout.jsx";
import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Categories, Packs } from "./pages/Master.jsx";
import { Products } from "./pages/Products.jsx";
import { ProductForm } from "./pages/ProductForm.jsx";
import { Customers, Enquiries, Orders } from "./pages/Sales.jsx";
import { OrderDetail } from "./pages/OrderDetail.jsx";
import { CustomerReviews } from "./pages/Reviews.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { DownloadReport, ScheduleReport } from "./pages/ReportsHub.jsx";
import { AuditLog, ErrorLog } from "./pages/Logs.jsx";
import { ChangePassword, DbBackup, SchedulerSettings } from "./pages/Settings.jsx";
import { Endpoints } from "./pages/Endpoints.jsx";
import { NotificationConfig, NotificationLog } from "./pages/Notifications.jsx";
import { ReportBug } from "./pages/ReportBug.jsx";

function RedirectProduct() {
  const { id } = useParams();
  return <Navigate to={"/master/products/" + id} replace />;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="master/categories" element={<Categories />} />
            <Route path="master/packs" element={<Packs />} />
            <Route path="master/products" element={<Products />} />
            <Route path="master/products/new" element={<ProductForm />} />
            <Route path="master/products/:id" element={<ProductForm />} />
            <Route path="catalog/products/new" element={<Navigate to="/master/products/new" replace />} />
            <Route path="catalog/products/:id" element={<RedirectProduct />} />
            <Route path="catalog/products" element={<Navigate to="/master/products" replace />} />
            <Route path="sales/orders" element={<Orders />} />
            <Route path="sales/orders/:id" element={<OrderDetail />} />
            <Route path="sales/enquiries" element={<Enquiries />} />
            <Route path="sales/customers" element={<Customers />} />
            <Route path="sales/reviews" element={<CustomerReviews />} />
            <Route path="reports" element={<Analytics />} />
            <Route path="reports/download" element={<DownloadReport />} />
            <Route path="reports/schedule" element={<ScheduleReport />} />
            <Route path="logs/errors" element={<ErrorLog />} />
            <Route path="logs/audit" element={<AuditLog />} />
            <Route path="settings" element={<Navigate to="/settings/password" replace />} />
            <Route path="settings/password" element={<ChangePassword />} />
            <Route path="settings/scheduler" element={<SchedulerSettings />} />
            <Route path="settings/backup" element={<DbBackup />} />
            <Route path="settings/endpoints" element={<Endpoints />} />
            <Route path="notifications/config" element={<NotificationConfig />} />
            <Route path="notifications/log" element={<NotificationLog />} />
            <Route path="report-bug" element={<ReportBug />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
