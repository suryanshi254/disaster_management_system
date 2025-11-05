import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import Resources from "./pages/Resources";
import Volunteers from "./pages/Volunteers";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import IncidentDetail from "./pages/IncidentDetail";
import ReportIncident from "./pages/ReportIncident";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Content />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/report" element={<ReportIncident />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Disaster Management System
                </h1>
                <p className="text-gray-600">
                  Sign in to access emergency response tools
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
