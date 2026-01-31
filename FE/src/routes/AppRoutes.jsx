import DashboardLayout from "@/layouts/DashboardLayout";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard/Dashboard";
import AdminComplaints from "@/pages/admin/complaint/Complaint";
import AdminUsers from "@/pages/admin/users/Users";
import AdminAuditLog from "@/pages/admin/audit-log/AuditLog";
import AdminSettings from "@/pages/admin/settings/Settings";

// Citizen pages
import CitizenDashboard from "@/pages/citizen/dashboard/Dashboard";
import CitizenReports from "@/pages/citizen/reports/Reports";
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
import { Route, Routes } from "react-router-dom";
import Login from "@/pages/login/Login";
import Register from "@/pages/register/Register";

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public routes*/}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Citizen Routes */}
        <Route path="/citizen" element={<DashboardLayout />}>
          <Route index element={<CitizenDashboard />} />
          <Route path="reports" element={<CitizenReports />} />
          <Route path="rewards" element={<CitizenRewards />} />
          <Route path="leaderboard" element={<CitizenLeaderboard />} />
          <Route path="complaints" element={<CitizenComplaints />} />
        </Route>

        {/* Enterprise Routes */}
        <Route path="/enterprise" element={<DashboardLayout />}>
          <Route index element={<EnterpriseDashboard />} />
          <Route path="reports" element={<EnterpriseReports />} />
          <Route path="employees" element={<EnterpriseEmployees />} />
          <Route path="rewards-config" element={<EnterpriseRewardsConfig />} />
        </Route>

        {/* Collector Routes */}
        <Route path="/collector" element={<DashboardLayout />}>
          <Route index element={<CollectorDashboard />} />
          <Route path="tasks" element={<CollectorTasks />} />
          <Route path="history" element={<CollectorHistory />} />
        </Route>
      </Routes>
    </>
  );
}

export default AppRoutes;
