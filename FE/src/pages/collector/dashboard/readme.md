TODO: Dashboard collector 
- [x] : Fix the dashboard to match the design in the wireframe is the website 
TODO: Tasks collector
- [ ] : Fix the tasks collector to match the design in the wireframe is the website 
 
Tasks collector - Implementation checklist
- [x] Step 1: Convert and build UI for `src/pages/collector/tasks/Tasks.jsx` from TSX to JSX (keep structure)
- [x] Step 2: Complete `taskData.jsx` mock data and filter options to feed UI
- [x] Step 4: Complete `taskDetailModal.jsx` modal UI and confirm action
- [x] Step 5: Verify route rendering, fix runtime/lint issues, and re-check all files in `src/pages/collector/tasks`


The next task - HISTORY Task - Implementation checklist 

- [x] Step 1: Convert `src/pages/collector/history/History.jsx` from TSX sample to JSX UI (same structure as provided design)
- [x] Step 2: Add local mock data for history jobs and filtering options (or create `historyData.jsx`)
- [x] Step 3: Build reusable UI parts used by History page:
  - `JobHistoryTable` (table + pagination)
  - `FilterBar` (search + area/date/SLA filters)
  - `StatsCards` (summary cards)
- [x] Step 4: Connect filter logic, paging, export button UI, and empty-state behavior
- [x] Step 5: Verify route rendering and run full error/lint check for `src/pages/collector/history`


This below is the code of the history @file: History.jsx but they use tsx to code generate, so we need to convert it to jsx. The convert is simple, just convert the tsx to jsx and fix the error if any. Use 100% code from the file Tasks.jsx and convert it to jsx. Like dashboard.jsx
1. the first [], you convert it to jsx 
2. i will check to continue the code, let do it and finish it must check the tick for me to check then can go to next step


Task - Collector Config 
Step 1 [] : 