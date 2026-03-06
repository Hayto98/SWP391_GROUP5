import { Toaster } from "sonner";
import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import AppErrorBoundary from "./components/AppErrorBoundary";
import EnterpriseOverview from "./pages/enterprise/overview/EnterpriseOverview";
import AcceptWasteConfig from "./pages/enterprise/rewards-config/accept-waste/AcceptWasteConfig";
import ServiceAreas from "./pages/enterprise/service-areas/ServiceAreas";
import PendingReports from "./pages/enterprise/reports/pending/PendingReports";
import ReportDetail from "./pages/enterprise/reports/detail/ReportDetail";
import Collectors from "./pages/enterprise/employees/collectors/Collectors";
import ProgressTracking from "./pages/enterprise/monitoring/monitoring/ProgressTracking";
import CollectionAnalytics from "./pages/enterprise/analytics/collection-report/CollectionAnalytics";
import CollectionReportDetail from "./pages/enterprise/reports/collection-detail/CollectionReportDetail";
import RewardSlaRules from "./pages/enterprise/rewards-config/rules/RewardSlaRules";
import ComplaintsEscalation from "./pages/enterprise/complaints/ComplaintsEscalation";
import EnterpriseProfileOverview from "./pages/enterprise/profile/overview/EnterpriseProfileOverview";

const reviewPages = {
  EnterpriseOverview,
  AcceptWasteConfig,
  ServiceAreas,
  PendingReports,
  ReportDetail,
  Collectors,
  ProgressTracking,
  CollectionAnalytics,
  CollectionReportDetail,
  RewardSlaRules,
  ComplaintsEscalation,
  EnterpriseProfileOverview,
};

void reviewPages;

function App() {
  return (
    <AppErrorBoundary>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </AppErrorBoundary>
  );
}

export default App;
