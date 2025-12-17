import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CalendarPage from "./pages/Calendar";
import ClassesPage from "./pages/Classes";
import TasksPage from "./pages/Tasks";
import ExamsPage from "./pages/Exams";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function Router() {
  return (
    <Switch>
      {/* Auth routes - outside DashboardLayout */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Dashboard routes */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/calendar" component={CalendarPage} />
            <Route path="/classes" component={ClassesPage} />
            <Route path="/tasks" component={TasksPage} />
            <Route path="/exams" component={ExamsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
