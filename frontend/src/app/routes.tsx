import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { FullScreenLoader, ProtectedRoute } from "../components/common";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import TeacherSessionPage from "../pages/teacher/TeacherSessionPage";
import StudentJoinPage from "../pages/student/StudentJoinPage";
import StudentSessionPage from "../pages/student/StudentSessionPage";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/session/:id"
        element={
          <ProtectedRoute role="TEACHER">
            <TeacherSessionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentJoinPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/session/:id"
        element={
          <ProtectedRoute role="STUDENT">
            <StudentSessionPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
