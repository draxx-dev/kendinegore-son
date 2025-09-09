import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkAndSendReminders } from './utils/smsReminder'

// Start SMS reminder system
checkAndSendReminders();

createRoot(document.getElementById("root")!).render(<App />);
