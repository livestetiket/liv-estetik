import {
  FiArchive,
  FiCalendar,
  FiGrid,
  FiMessageSquare,
  FiClock,
  FiUsers,
  FiScissors,
  FiStar,
  FiMail,
  FiPhone,
  FiBarChart2,
  FiSettings,
  FiUserCheck,
  FiUser,
  FiShield,
} from "react-icons/fi";

export const ROLE_NAV = {
  admin: [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "bookings", label: "Bookings", icon: FiCalendar },
    { id: "patients", label: "Patients", icon: FiUser },
    { id: "calls", label: "Call Activity", icon: FiPhone },
    { id: "visits", label: "Daily Visits", icon: FiUserCheck },
    { id: "messages", label: "Messages", icon: FiMessageSquare },
    { id: "slots", label: "Time Slots", icon: FiClock },
    { id: "users", label: "Users", icon: FiUsers },
    { id: "roles", label: "Role Management", icon: FiShield },
    { id: "services", label: "Services", icon: FiScissors },
    { id: "emails", label: "Emails", icon: FiMail },
    { id: "audit", label: "Audit Logs", icon: FiArchive },
    { id: "reports", label: "Reports", icon: FiBarChart2 },
    { id: "settings", label: "Clinic Settings", icon: FiSettings },
  ],
  reception: [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "bookings", label: "Bookings", icon: FiCalendar },
    { id: "patients", label: "Patients", icon: FiUser },
    { id: "visits", label: "Daily Visits", icon: FiUserCheck },
    { id: "messages", label: "Messages", icon: FiMessageSquare },
    { id: "slots", label: "Time Slots", icon: FiClock },
    { id: "reports", label: "Reports", icon: FiBarChart2 },
    { id: "testimonials", label: "Testimonials", icon: FiStar },
  ],
  call_center_agent: [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "calls", label: "Assigned call follow-ups", icon: FiPhone },
  ],
};

const PERMISSION_NAV = [
  ["bookings.view", "bookings", "Bookings", FiCalendar],
  ["patients.view", "patients", "Patients", FiUser],
  ["calls.view", "calls", "Call Activity", FiPhone],
  ["daily_visits.view", "visits", "Daily Visits", FiUserCheck],
  ["messages.view", "messages", "Messages", FiMessageSquare],
  ["time_slots.view", "slots", "Time Slots", FiClock],
  ["services.view", "services", "Services", FiScissors],
  ["testimonials.view", "testimonials", "Testimonials", FiStar],
  ["reports.view", "reports", "Reports", FiBarChart2],
  ["audit_logs.view", "audit", "Audit Logs", FiArchive],
];

export function buildRoleNavigation(permissions = []) {
  const allowed = new Set(permissions);
  return [
    { id: "overview", label: "Overview", icon: FiGrid },
    ...PERMISSION_NAV.filter(([permission]) => allowed.has(permission)).map(([, id, label, icon]) => ({ id, label, icon })),
  ];
}
