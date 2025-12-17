# Campass Project TODO

## Core Features
- [x] Database schema (classes, tasks, exams, events tables)
- [x] Global styles with pastel color palette
- [x] Dashboard layout with dark sidebar
- [x] Mobile responsive drawer navigation
- [x] tRPC routers for CRUD operations

## Pages
- [x] Dashboard home with Today's Schedule, Upcoming Exams/Tasks, Quick Stats
- [x] Calendar page with FullCalendar integration
- [x] Classes management page
- [x] Tasks management page
- [x] Exams management page
- [x] Settings page

## UI Components
- [x] Soft shadow card components
- [x] Pastel colored event cards
- [x] Status badges (Confirmed, Pending, etc.)
- [x] Form dialogs for CRUD operations

## Additional Features
- [x] Dark mode support
- [x] Responsive design (mobile drawer)
- [x] Unit tests for routers

## Fixes and Improvements (v2)
- [x] Light mode sidebar color adjustment (less contrast)
- [x] Remove hover box movement effects
- [x] Mobile sidebar auto-close on click
- [x] Settings page layout - full width or centered
- [x] Calendar button effects - simple and non-persistent
- [x] Calendar date click - auto-fill Start/End Date
- [x] Classes - period selection (1-5) and duration (1-2 periods)
- [x] Dashboard redesign - timetable left, calendar + selected day tasks right
- [x] Remove left border decoration from colorful cards

## Fixes and Improvements (v3)
- [x] Remove Dashboard top stats cards
- [x] Update period times (1限: 8:45-10:15, 2限: 10:30-12:00, 3限: 13:00-14:30, 4限: 14:45-16:15, 5限: 16:30-18:00)
- [x] Add current time indicator to timetable (highlight current class or gap between classes)
- [x] Click timetable cell to set/edit class
- [x] Unify timetable cell width on PC
- [x] Mobile: show only today's column in timetable
- [x] Calendar: show dots for days with events/tasks/exams
- [x] Sidebar: show badge with pending tasks and exams within 2 weeks

## Bug Fixes (v4)
- [ ] Fix tRPC API error (Unexpected token '<' - HTML response instead of JSON)
- [ ] Fix React key prop warning in Home.tsx
