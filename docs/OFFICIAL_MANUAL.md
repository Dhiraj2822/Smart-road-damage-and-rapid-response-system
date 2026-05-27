# Official Dashboard Manual - SMC Officials

## Getting Started

### Login
1. Open dashboard at http://localhost:5174
2. Use your official credentials
3. Default accounts (for testing):
   - Admin: admin@solapur.gov.in / admin123
   - Dept Head: eng.head@solapur.gov.in / admin123
   - Ward Officer: ward.officer@solapur.gov.in / admin123

## Dashboard Overview

### Statistics Cards
- **Total Complaints**: All complaints in system
- **Pending**: Submitted + Verified complaints
- **In Progress**: Assigned + In Progress
- **Resolved**: Successfully completed

### Charts
- **Pie Chart**: Distribution by status
- **Severity Alert**: Critical & High priority count

## Managing Complaints

### View All Complaints
1. Click **Complaints** in sidebar
2. See data grid with all complaints
3. Use filters:
   - Status
   - Severity
   - Ward
   - Date range

### Verify Complaints

**Process:**
1. Click on complaint row
2. Review:
   - Photos and AI analysis
   - Location and description
   - Citizen details
3. Click **Verify** button
4. Confirm verification
5. Complaint moves to VERIFIED status

**Rejection:**
1. Click **Reject** if invalid
2. Provide reason
3. Citizen will be notified

### Assign Complaints

**To Department:**
1. Select verified complaint
2. Click **Assign**
3. Choose department
4. Select official (optional)
5. Confirm assignment

**To Contractor:**
1. Select complaint
2. Click **Assign to Contractor**
3. Choose from list
4. Set deadline
5. Confirm

### Update Status

**Mark In Progress:**
1. Open assigned complaint
2. Click **Update Status**
3. Select **IN_PROGRESS**
4. Add comments (optional)
5. Save

**Mark Resolved:**
1. Open in-progress complaint
2. Click **Mark Resolved**
3. Enter actual cost (if applicable)
4. Add completion notes
5. Confirm
6. Citizen receives notification

## Map View

### Using the Map
1. Click **Map View** in sidebar
2. See all complaints as markers
3. Color coding:
   - Red: Critical
   - Orange: High
   - Yellow: Medium
   - Green: Low
4. Click marker to see details
5. Use filters to show specific types

## Analytics & Reports

### View Analytics
1. Click **Analytics** in sidebar
2. See metrics:
   - Total complaints (period)
   - Resolution rate
   - Average resolution time
   - Department performance

### Generate Reports
1. Select date range
2. Choose report type:
   - Summary Report
   - Department Performance
   - Contractor Performance
   - Ward-wise Statistics
3. Click **Generate**
4. Download as PDF or Excel

## Priority Management

### Understanding Priority Scores

Priority calculated based on:
- **Severity** (40%): Damage extent
- **Traffic Impact** (30%): Road type
- **Age** (20%): Days pending
- **Public Safety** (10%): Near schools/hospitals

**Priority Levels:**
- 8-10: Urgent (handle immediately)
- 6-8: High (within 24 hours)
- 4-6: Medium (within 3 days)
- 0-4: Low (within 7 days)

### Sort by Priority
1. In complaints list
2. Click **Priority** column header
3. Highest priority shown first
4. Focus on urgent items

## Department Routing

### Auto-Assignment Rules

System automatically routes to:
- **Engineering**: Potholes, cracks, major damage
- **Drainage**: Water logging, drainage issues
- **Water Supply**: Water leaks, pipe damage
- **Traffic**: Highway critical issues
- **Ward Office**: Residential roads

### Manual Override
1. Select complaint
2. Click **Change Department**
3. Choose new department
4. Provide reason
5. Confirm

## SLA Tracking

### View SLA Status
- Green: Within SLA
- Yellow: Approaching deadline
- Red: SLA breached

### Escalation
- System auto-escalates breached SLAs
- Senior officials notified
- Appears in escalation dashboard

## User Management (Admin Only)

### Add New Official
1. Click **Users** (admin menu)
2. Click **Add User**
3. Fill details:
   - Name, email, phone
   - Role (Ward Officer, Dept Head, etc.)
   - Department
4. Save
5. User receives credentials via email

### Manage Contractors
1. Click **Contractors**
2. View list with ratings
3. Add/Edit/Deactivate contractors
4. View performance history

## Best Practices

 **DO:**
- Verify complaints within 24 hours
- Provide clear rejection reasons
- Update status regularly
- Monitor high-priority items
- Respond to escalations promptly

 **DON'T:**
- Ignore critical complaints
- Reject without proper review
- Delay assignments
- Miss SLA deadlines

## Troubleshooting

**Can't see complaints?**
- Check department filter
- Verify your role permissions
- Refresh the page

**Assignment not working?**
- Ensure complaint is verified
- Check department availability
- Contact admin if issue persists

**Reports not generating?**
- Check date range
- Ensure data exists for period
- Try different browser

## Keyboard Shortcuts

- Ctrl + N: New verification
- Ctrl + F: Search complaints
- Ctrl + R: Refresh data
- Esc: Close dialogs

## Contact IT Support

- **Email**: it@solapur.gov.in
- **Phone**: 0217-2123499
- **Hours**: 24/7 for critical issues
