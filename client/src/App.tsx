import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
import { ThemeProvider } from "./contexts/ThemeContext";
import { FeedbackProvider } from "./components/material/Feedback";
import { AppLoading } from "./components/material/Page";
const Home = lazy(() => import("./pages/Home"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Classes = lazy(() => import("./pages/Classes"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Exams = lazy(() => import("./pages/Exams"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));
export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <FeedbackProvider>
          <Suspense fallback={<AppLoading />}>
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/signup" component={Signup} />
              <Route>
                <DashboardLayout>
                  <Suspense fallback={<AppLoading />}>
                    <Switch>
                      <Route path="/" component={Home} />
                      <Route path="/calendar" component={Calendar} />
                      <Route path="/classes" component={Classes} />
                      <Route path="/tasks" component={Tasks} />
                      <Route path="/exams" component={Exams} />
                      <Route path="/settings" component={Settings} />
                      <Route component={NotFound} />
                    </Switch>
                  </Suspense>
                </DashboardLayout>
              </Route>
            </Switch>
          </Suspense>
        </FeedbackProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
