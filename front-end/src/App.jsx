import { Routes, Route } from "react-router-dom";
import Register from "./components/Signpage/register.jsx";
import Login from "./components/Signpage/login.jsx";
import Profile from "./components/Signpage/profile.jsx";
import ForgotPasswordModal from "./components/Signpage/forgotPasswordModal.jsx";
import Home from "./components/Homepage/home.jsx";
import QuesticAdmissionAdvisor from "./components/Career/career.jsx";
import InterviewApp from "./components/pv/interviewai.jsx";
import Premium from "./components/Premium/premium.jsx";
import Firstplan from "./components/Premium/firstplan.jsx";
import QuesticHobbyAdvisor from "./components/Career/hobby.jsx";
import "./App.css";
import TestResultDetail from "./components/Signpage/TestResultDetail.jsx";
import Chatbot from "./components/chatbot/Chatbot.jsx";
import EvaluateCV from "./components/cv/EvaluateCV.jsx";
import UniversityPage from "./components/university/UniversityPage.jsx";
import ListJob from "./components/university/list_job/ListJob.jsx";
import ListUniversity from "./components/university/list_university/ListUniversity.jsx";
import MajorPage from "./components/major/major.jsx";
import AuthTestComponent from "./components/AuthTestComponent.jsx";
import TokenDebugger from "./components/TokenDebugger.jsx";
import ServiceStatusPanel from "./components/ServiceStatusPanel.jsx";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpass" element={<ForgotPasswordModal />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/career" element={<QuesticAdmissionAdvisor />} />
        <Route path="/hobby" element={<QuesticHobbyAdvisor />} />
        <Route path="/interview" element={<InterviewApp />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/firstplan" element={<Firstplan />} />
        <Route path="/test-result/:testId" element={<TestResultDetail />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/evaluatecv" element={<EvaluateCV />} />
        <Route path="/university" element={<UniversityPage />} />
        <Route path="/university/list_job" element={<ListJob />} />
        <Route path="/major" element={<MajorPage />} />
        <Route path="/major/:majorSlug" element={<MajorPage />} />
        <Route
          path="/university/list_university"
          element={<ListUniversity />}
        />
        <Route path="/test-auth" element={<AuthTestComponent />} />
        <Route path="/debug-token" element={<TokenDebugger />} />
        <Route path="/service-status" element={<ServiceStatusPanel />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
