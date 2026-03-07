import DashboardLayout from "@/layouts/DashboardLayout";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard/Dashboard";
import AdminComplaints from "@/pages/admin/complaint/Complaint";
import AdminUsers from "@/pages/admin/users/Users";
import AdminAuditLog from "@/pages/admin/audit-log/AuditLog";
import AdminSettings from "@/pages/admin/settings/Settings";

// Citizen pages
import CitizenDashboard from "@/pages/citizen/dashboard/Dashboard";
import CitizenTrashReport from "@/pages/citizen/trash-report/TrashReport";
import CitizenReports from "@/pages/citizen/reports/Reports";
import CitizenReportDetail from "@/pages/citizen/reports/ReportDetailPage";
import CitizenRewards from "@/pages/citizen/rewards/Rewards";
import CitizenLeaderboard from "@/pages/citizen/leaderboard/Leaderboard";
import CitizenComplaints from "@/pages/citizen/complaints/Complaints";

// Enterprise pages
import EnterpriseDashboard from "@/pages/enterprise/dashboard/Dashboard";
import EnterpriseReports from "@/pages/enterprise/reports/Reports";
import EnterpriseEmployees from "@/pages/enterprise/employees/Employees";
import EnterpriseRewardsConfig from "@/pages/enterprise/rewards-config/RewardsConfig";

// Collector pages
import CollectorDashboard from "@/pages/collector/dashboard/Dashboard";
import CollectorTasks from "@/pages/collector/tasks/Tasks";
import CollectorHistory from "@/pages/collector/history/History";

import React from "react";
import Homepage from "@/pages/homepage/Homepage";
import { Route, Routes } from "react-router-dom";
import Login from "@/pages/login/Login";
import Register from "@/pages/register/Register";
import Forbidden from "@/pages/error/Forbidden";
import NotFound from "@/pages/error/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRoute } from "@/components/RoleRoute";

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Homepage Route */}
        <Route path="/" element={<Homepage />} />
        {/* Public routes*/}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Citizen Routes */}
          <Route element={<RoleRoute allowedRoles={["citizen"]} />}>
            <Route path="/citizen" element={<DashboardLayout />}>
              <Route index element={<CitizenDashboard />} />
              <Route path="trash-report" element={<CitizenTrashReport />} />
              <Route path="reports" element={<CitizenReports />} />
              <Route
                path="reports/:reportId"
                element={<CitizenReportDetail />}
              />
              <Route path="rewards" element={<CitizenRewards />} />
              <Route path="leaderboard" element={<CitizenLeaderboard />} />
              <Route path="complaints" element={<CitizenComplaints />} />
            </Route>
          </Route>

          {/* Enterprise Routes */}
          <Route element={<RoleRoute allowedRoles={["enterprise"]} />}>
            <Route path="/enterprise" element={<DashboardLayout />}>
              <Route index element={<EnterpriseDashboard />} />
              <Route path="reports" element={<EnterpriseReports />} />
              <Route path="employees" element={<EnterpriseEmployees />} />
              <Route
                path="rewards-config"
                element={<EnterpriseRewardsConfig />}
              />
            </Route>
          </Route>

          {/* Collector Routes */}
          <Route element={<RoleRoute allowedRoles={["collector"]} />}>
            <Route path="/collector" element={<DashboardLayout />}>
              <Route index element={<CollectorDashboard />} />
              <Route path="tasks" element={<CollectorTasks />} />
              <Route path="history" element={<CollectorHistory />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default AppRoutes;
