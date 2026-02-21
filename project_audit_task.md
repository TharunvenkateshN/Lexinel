# Task: Comprehensive Project Audit and Fix

## 1. Backend Stabilization 🔴

- [ ] Kill all zombie processes on port 7860.
- [ ] Restart backend and verify `/api/dashboard/stats`, `/api/policies`, `/api/dashboard/monitor`.
- [ ] Check backend logs for any startup errors.

## 2. Dashboard Home Audit (`/dashboard`) 🔘

- [ ] Verify KPI cards (Active Policies, Total Traces, Blocked Threats) are fetching data correctly.
- [ ] Verify "Recent Violations" table displays data.
- [ ] Check for console errors on page load.

## 3. Monitor Page Audit (`/dashboard/monitor`) 🔘

- [ ] Verify "Live Threat Monitor" feed is receiving updates.
- [ ] Test Scroll Lock/Pause functionality.
- [ ] Verify error handling for failed stream connections.

## 4. Remediate Page Audit (`/dashboard/remediate`) 🔘

- [ ] Verify Violation List fetches from `/api/sentinel/violations`.
- [ ] Verify clicking a violation opens the "Evidence Dossier".
- [ ] Test "Send to Human Review" button (Verify `/api/sentinel/resolve` call).
- [ ] Test "Freeze Account" button (Verify `/api/system/freeze` and `/resolve` calls).
- [ ] Test "Draft SAR" button.

## 5. Evaluate Page Audit (`/dashboard/evaluate`) 🔘

- [ ] Verify Policy List fetches from `/api/policies`.
- [ ] Test "Deploy New Guardrail" (Policy creation).
- [ ] Verify policy toggle (Enable/Disable).

## 6. Red Team Page Audit (`/dashboard/redteam`) 🔘

- [ ] Verify "Launch Attack" starts the simulation.
- [ ] Verify streaming logs are displayed in real-time.
- [ ] Verify results summary is shown after completion.
