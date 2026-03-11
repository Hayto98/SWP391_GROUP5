import DashboardLayout from "@/layouts/DashboardLayout";

// Admin pages
import AdminAuditLog from "@/pages/admin/audit-log/AuditLog";
import AdminComplaints from "@/pages/admin/complaint/Complaint";
import AdminDashboard from "@/pages/admin/dashboard/Dashboard";
import AdminSettings from "@/pages/admin/settings/Settings";
import AdminUsers from "@/pages/admin/users/Users";

// Citizen pages
import CitizenComplaints from "@/pages/citizen/complaints/Complaints";
import CitizenDashboard from "@/pages/citizen/dashboard/Dashboard";
import CitizenLeaderboard from "@/pages/citizen/leaderboard/Leaderboard";
import CitizenReportDetail from "@/pages/citizen/reports/ReportDetailPage";
import CitizenReports from "@/pages/citizen/reports/Reports";
import CitizenRewards from "@/pages/citizen/rewards/Rewards";
import CitizenTrashReport from "@/pages/citizen/trash-report/TrashReport";

// Enterprise pages
import EnterpriseCollectionAnalytics from "@/pages/enterprise/analytics/collection-report/CollectionAnalytics";
import EnterpriseComplaintsEscalation from "@/pages/enterprise/complaints/ComplaintsEscalation";
import EnterpriseDashboard from "@/pages/enterprise/dashboard/Dashboard";
import EnterpriseEmployees from "@/pages/enterprise/employees/Employees";
import EnterpriseCollectors from "@/pages/enterprise/employees/collectors/Collectors";
import EnterpriseProgressTracking from "@/pages/enterprise/monitoring/monitoring/ProgressTracking";
import Orders from "@/pages/enterprise/orders/Orders";
import EnterpriseProfileOverview from "@/pages/enterprise/profile/overview/EnterpriseProfileOverview";
import EnterpriseReports from "@/pages/enterprise/reports/Reports";
import EnterpriseCollectionReportDetail from "@/pages/enterprise/reports/collection-detail/CollectionReportDetail";
import EnterpriseReportDetail from "@/pages/enterprise/reports/detail/ReportDetail";
import EnterprisePendingReports from "@/pages/enterprise/reports/pending/PendingReports";
import EnterpriseRewardsConfig from "@/pages/enterprise/rewards-config/RewardsConfig";
import EnterpriseAcceptWasteConfig from "@/pages/enterprise/rewards-config/accept-waste/AcceptWasteConfig";
import EnterpriseRewardSlaRules from "@/pages/enterprise/rewards-config/rules/RewardSlaRules";
import Warehouse from "@/pages/enterprise/warehouse/Warehouse";

// Collector pages
import CollectorDashboard from "@/pages/collector/dashboard/Dashboard";
import CollectorHistory from "@/pages/collector/history/History";
import CollectorTasks from "@/pages/collector/tasks/Tasks";
import CollectorTaskAccept from "@/pages/collector/tasks/taskAcept";
import CollectorTaskCollect from "@/pages/collector/tasks/taskCollect";
import CollectorTaskDetail from "@/pages/collector/tasks/taskDetail";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleRoute } from "@/components/RoleRoute";
import ComplaintDetail from "@/pages/citizen/complaints/ComplaintDetail";
import Forbidden from "@/pages/error/Forbidden";
import NotFound from "@/pages/error/NotFound";
import Homepage from "@/pages/homepage/Homepage";
import Login from "@/pages/login/Login";
import Register from "@/pages/register/Register";
import { Route, Routes } from "react-router-dom";

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
              <Route
                path="complaints/:reportId"
                element={<ComplaintDetail />}
              />
            </Route>
          </Route>

          {/* Enterprise Routes */}
          <Route element={<RoleRoute allowedRoles={["enterprise"]} />}>
            <Route path="/enterprise" element={<DashboardLayout />}>
              <Route index element={<EnterpriseDashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route
                path="monitoring/progress-tracking"
                element={<EnterpriseProgressTracking />}
              />
              <Route
                path="analytics/collection-report"
                element={<EnterpriseCollectionAnalytics />}
              />
              <Route path="reports" element={<EnterpriseReports />} />
              <Route
                path="reports/pending"
                element={<EnterprisePendingReports />}
              />
              <Route
                path="reports/detail"
                element={<EnterpriseReportDetail />}
              />
              <Route
                path="reports/detail/:id"
                element={<EnterpriseReportDetail />}
              />
              <Route
                path="reports/collection-detail"
                element={<EnterpriseCollectionReportDetail />}
              />
              <Route
                path="reports/collection-detail/:id"
                element={<EnterpriseCollectionReportDetail />}
              />
              <Route path="employees" element={<EnterpriseEmployees />} />
              <Route
                path="employees/collectors"
                element={<EnterpriseCollectors />}
              />
              <Route
                path="rewards-config"
                element={<EnterpriseRewardsConfig />}
              />
              <Route
                path="rewards-config/accept-waste"
                element={<EnterpriseAcceptWasteConfig />}
              />
              <Route
                path="rewards-config/rules"
                element={<EnterpriseRewardSlaRules />}
              />
              <Route
                path="complaints/escalation"
                element={<EnterpriseComplaintsEscalation />}
              />
              <Route
                path="profile/overview"
                element={<EnterpriseProfileOverview />}
              />
            </Route>
          </Route>

          {/* Collector Routes */}
          <Route element={<RoleRoute allowedRoles={["collector"]} />}>
            <Route path="/collector" element={<DashboardLayout />}>
              <Route index element={<CollectorDashboard />} />
              <Route path="tasks" element={<CollectorTasks />} />
              <Route path="tasks/:taskId" element={<CollectorTaskDetail />} />
              <Route
                path="tasks/:taskId/accept"
                element={<CollectorTaskAccept />}
              />
              <Route
                path="tasks/:taskId/collect"
                element={<CollectorTaskCollect />}
              />
              <Route path="history" element={<CollectorHistory />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default AppRoutes;
