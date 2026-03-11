import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Gift,
  History,
  PieChart,
  Settings2,
  Shield,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";

export const navByRole = {
  citizen: [
    {
      title: "Tổng quan",
      url: "/citizen",
      icon: PieChart,
    },
    {
      title: "Báo cáo rác",
      url: "/citizen/trash-report",
      icon: Trash2,
    },
    {
      title: "Báo cáo của tôi",
      url: "/citizen/reports",
      icon: FileText,
    },
    {
      title: "Điểm & Thưởng",
      url: "/citizen/rewards",
      icon: Gift,
    },
    {
      title: "Bảng xếp hạng",
      url: "/citizen/leaderboard",
      icon: Trophy,
    },
    {
      title: "Khiếu nại",
      url: "/citizen/complaints",
      icon: AlertTriangle,
    },
  ],

  enterprise: [
    {
      title: "Điều hành",
      url: "/enterprise",
      icon: PieChart,
    },
    {
      title: "Báo cáo",
      url: "/enterprise/reports",
      icon: FileText,
    },
    {
      title: "Nhân sự",
      url: "/enterprise/employees",
      icon: Users,
    },
    {
      title: "Cấu hình",
      icon: Settings2,
      items: [
        {
          title: "Hoạt động điểm thưởng",
          url: "/enterprise/rewards-config",
        },
        {
          title: "Cấu hình điểm thưởng",
          url: "/enterprise/rewards-config/rules",
        },
      ],
    },
    {
      title: "Hỗ trợ",
      icon: AlertTriangle,
      items: [
        {
          title: "Khiếu nại Escalation",
          url: "/enterprise/complaints/escalation",
        },
        {
          title: "Hồ sơ doanh nghiệp",
          url: "/enterprise/profile/overview",
        },
      ],
    },
  ],

  collector: [
    {
      title: "Tổng quan",
      url: "/collector",
      icon: PieChart,
    },
    {
      title: "Nhiệm vụ",
      url: "/collector/tasks",
      icon: ClipboardList,
    },
    {
      title: "Lịch sử công việc",
      url: "/collector/history",
      icon: History,
    },
  ],

  admin: [
    {
      title: "Tổng quan",
      url: "/admin",
      icon: PieChart,
    },
    {
      title: "Quản lý người dùng",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Khiếu nại",
      url: "/admin/complaints",
      icon: AlertTriangle,
    },
    {
      title: "Nhật ký hệ thống",
      url: "/admin/audit-log",
      icon: Shield,
    },
    {
      title: "Cài đặt",
      url: "/admin/settings",
      icon: Settings2,
    },
  ],
};
