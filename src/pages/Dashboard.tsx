import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import Overview from "./dashboard/Overview";
import Services from "./dashboard/Services";
import WorkingHours from "./dashboard/WorkingHours";
import Staff from "./dashboard/Staff";
import Appointments from "./dashboard/Appointments";
import Customers from "./dashboard/Customers";
import Payments from "./dashboard/Payments";
import Settings from "./dashboard/Settings";
import BusinessDetails from "./dashboard/BusinessDetails";
import OnlineBooking from "./dashboard/OnlineBooking";
import SMSIntegration from "./dashboard/SMSIntegration";
import WhatsAppAI from "./dashboard/WhatsAppAI";
import Contact from "./dashboard/Contact";
import Roadmap from "./dashboard/Roadmap";
import SystemPayments from "./dashboard/SystemPayments";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/services/*" element={<Services />} />
        <Route path="/working-hours" element={<WorkingHours />} />
        <Route path="/staff/*" element={<Staff />} />
        <Route path="/appointments/*" element={<Appointments />} />
        <Route path="/customers/*" element={<Customers />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/business-details" element={<BusinessDetails />} />
        <Route path="/online-booking" element={<OnlineBooking />} />
        <Route path="/sms-integration" element={<SMSIntegration />} />
        <Route path="/whatsapp-ai" element={<WhatsAppAI />} />
        <Route path="/system-payments" element={<SystemPayments />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;