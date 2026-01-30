import { Routes, Route } from "react-router-dom";
import RoleSelectPage from "../pages/RoleSelect/RoleSelectPage";
import TeacherCreatePollPage from "../pages/Teacher/TeacherCreatePollPage";
import TeacherLivePollPage from "../pages/Teacher/TeacherLivePollPage"
import TeacherPollHistoryPage from "../pages/Teacher/TeacherPollHistoryPage";
import StudentLogin from "../pages/Student/StudentLogin";
import StudentPollPage from "../pages/Student/StudentPollPage";




const StudentPage = () => <div>Student Page</div>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectPage />} />

      <Route path="/teacher/create" element={<TeacherCreatePollPage />} />
      <Route path="/teacher/live" element={<TeacherLivePollPage />} />
      <Route path="/teacher/history" element={<TeacherPollHistoryPage />} />


      <Route path="/student" element={<StudentPage />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/poll" element={<StudentPollPage />} />


    </Routes>
  );
}
