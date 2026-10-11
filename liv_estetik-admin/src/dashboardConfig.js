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
} from "react-icons/fi";

export const ROLE_NAV = {
  admin: [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "bookings", label: "Bookings", icon: FiCalendar },
    { id: "messages", label: "Messages", icon: FiMessageSquare },
    { id: "slots", label: "Time Slots", icon: FiClock },
    { id: "users", label: "Users", icon: FiUsers },
    { id: "services", label: "Services", icon: FiScissors },
    { id: "testimonials", label: "Testimonials", icon: FiStar },
    { id: "emails", label: "Emails", icon: FiMail },
    { id: "audit", label: "Audit Logs", icon: FiArchive },
  ],
  reception: [
    { id: "overview", label: "Overview", icon: FiGrid },
    { id: "bookings", label: "Bookings", icon: FiCalendar },
    { id: "messages", label: "Messages", icon: FiMessageSquare },
    { id: "slots", label: "Time Slots", icon: FiClock },
  ],
};
