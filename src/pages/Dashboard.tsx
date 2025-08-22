import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import Overview from "./dashboard/Overview";
import Services from "./dashboard/Services";
import WorkingHours from "./dashboard/WorkingHours";
import Staff from "./dashboard/Staff";
import Appointments from "./dashboard/Appointments";
import Customers from "./dashboard/Customers";
import Payments from "./dashboard/Payments";

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
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;