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
import Calls from "../views/Calls";
import SocialActivity from "../views/SocialActivity";
import Reports from "../views/Reports";
import ClinicSettings from "../views/ClinicSettings";

const VIEW_MAP = {
  overview: Overview,
  bookings: Bookings,
  calls: Calls,
  messages: Messages,
  slots: TimeSlots,
  users: Users,
  services: Services,
  testimonials: Testimonials,
  emails: Emails,
  audit: AuditLogs,
  social: SocialActivity,
  reports: Reports,
  settings: ClinicSettings,
  account: AccountSettings,
};

export default function ActiveView(props) {
  const Component = VIEW_MAP[props.view] || Overview;
  return <Component {...props} />;
}
