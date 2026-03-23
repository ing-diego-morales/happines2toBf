import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Codes from "./pages/Codes";
import AuthorizedEmails from "./pages/AuthorizedEmails";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import Users from "./pages/Users";
import ResetPass from "./pages/ResetPass";
import ConfirmReset from "./pages/ConfirmReset";
import Shop from "./pages/Tienda";
import Categorias from "./pages/Categorias";
import ProductosAdm from "./pages/ProductosAdm";
import Historial from "./pages/Historial";
import DefaultAccess from "./pages/DefaultAccess";
import ModificarCuentas from "./pages/ModificarCuentas";
import RecargaResultado from "./pages/RecargaResultado";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e293b",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "14px 18px",
              borderRadius: "12px",
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPass />} />
          <Route path="/reset" element={<ConfirmReset />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/home" replace />} />

            <Route path="home" element={<Home />} />
            <Route path="codes" element={<Codes />} />
            <Route path="authorizedEmails" element={<AuthorizedEmails />} />
            <Route path="users" element={<Users />} />
            <Route path="profile" element={<Profile />} />
            <Route path="shop" element={<Shop />} />
            <Route path="historial" element={<Historial />} />
            <Route path="recarga/resultado" element={<RecargaResultado />} />
            <Route
              path="categorias"
              element={
                <AdminRoute>
                  <Categorias />
                </AdminRoute>
              }
            />
            <Route
              path="productos-adm"
              element={
                <AdminRoute>
                  <ProductosAdm />
                </AdminRoute>
              }
            />
            <Route
              path="default-access"
              element={
                <AdminRoute>
                  <DefaultAccess />
                </AdminRoute>
              }
            />
            <Route
              path="modificar-cuentas"
              element={
                <AdminRoute>
                  <ModificarCuentas />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
