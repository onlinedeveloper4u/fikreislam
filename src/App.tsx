import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { UploadProvider } from "@/contexts/UploadContext";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Eager load the main page
import Index from "./pages/Index";

// Lazy load other pages for better performance
const Books = lazy(() => import("./pages/Books"));
const Audio = lazy(() => import("./pages/Audio"));
const VideoPage = lazy(() => import("./pages/VideoPage"));
const QA = lazy(() => import("./pages/QA"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Library = lazy(() => import("./pages/Library"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin components (lazy loaded for the nested routes)
const AllContentList = lazy(() => import("@/components/admin/AllContentList").then(m => ({ default: m.AllContentList })));
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const AdminAnalytics = lazy(() => import("@/components/admin/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));
const TaxonomyManagement = lazy(() => import("@/components/admin/TaxonomyManagement").then(m => ({ default: m.TaxonomyManagement })));
const UploadTracker = lazy(() => import("@/components/dashboard/UploadTracker").then(m => ({ default: m.UploadTracker })));


const queryClient = new QueryClient();

import ProtectedRoute from "@/components/auth/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <UploadProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner fullScreen size="lg" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/books" element={<Books />} />
                  <Route path="/audio" element={<Audio />} />
                  <Route path="/video" element={<VideoPage />} />
                  <Route path="/qa" element={<QA />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="analytics" replace />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="content" element={<AllContentList />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="taxonomies" element={<TaxonomyManagement />} />
                    <Route path="uploads" element={<UploadTracker />} />
                  </Route>

                  {/* Redirect old redundant paths */}
                  <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                  <Route path="/contributor" element={<Navigate to="/admin" replace />} />

                  <Route
                    path="/library"
                    element={
                      <ProtectedRoute>
                        <Library />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                  <Route path="/404" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </UploadProvider>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
