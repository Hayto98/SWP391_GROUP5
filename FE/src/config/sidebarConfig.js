import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Gift,
  History,
  PieChart,
  Settings2,
  Shield,
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
      title: "Tổng quan",
      url: "/enterprise",
      icon: PieChart,
    },
    {
      title: "Quản lý báo cáo",
      url: "/enterprise/reports",
      icon: FileText,
    },
    {
      title: "Quản lý nhân viên",
      url: "/enterprise/employees",
      icon: Users,
    },
    {
      title: "Cấu hình điểm thưởng",
      url: "/enterprise/rewards-config",
      icon: Settings2,
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
