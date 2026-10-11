import Overview from "../views/Overview";
import Bookings from "../views/Bookings";
import Messages from "../views/Messages";
import TimeSlots from "../views/TimeSlots";
import Users from "../views/Users";
import Services from "../views/Services";
import Testimonials from "../views/Testimonials";
import AuditLogs from "../views/AuditLogs";
import Emails from "../views/Emails";
import AccountSettings from "../views/AccountSettings";

const VIEW_MAP = {
  overview: Overview,
  bookings: Bookings,
  messages: Messages,
  slots: TimeSlots,
  users: Users,
  services: Services,
  testimonials: Testimonials,
  emails: Emails,
  audit: AuditLogs,
  account: AccountSettings,
};

export default function ActiveView(props) {
  const Component = VIEW_MAP[props.view] || Overview;
  return <Component {...props} />;
}
