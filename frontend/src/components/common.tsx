import { type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, type Role } from "../auth/AuthContext";

export function FullScreenLoader() {
  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 rounded-full border-4 border-softgray border-t-sky"
      />
    </div>
  );
}

export function ProtectedRoute({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace />;
  }
  return <>{children}</>;
}

export function TopBar({ subtitle }: { subtitle?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2 bg-charcoal text-white font-fredoka font-semibold px-4 py-1.5 rounded-full text-sm">
        Intervue Poll
        {subtitle && <span className="text-white/50 font-normal hidden sm:inline">· {subtitle}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-nunito font-semibold text-charcoal/70 hidden sm:inline">
          {user?.name} <span className="text-charcoal/40">({user?.role.toLowerCase()})</span>
        </span>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="font-fredoka font-semibold text-coral border-2 border-coral bg-white rounded-full px-4 py-1.5 cursor-pointer hover:bg-coral/10 transition-colors text-sm"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
