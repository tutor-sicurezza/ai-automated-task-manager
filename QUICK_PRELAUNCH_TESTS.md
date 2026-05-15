# ⚡ Quick Pre-Launch Testing Guide

**Time Required:** 60 minutes  
**Priority:** HIGH - Complete before launch  
**Status:** [ ] NOT STARTED

---

## 🎯 What You Need to Do

You need to **manually test** the application to verify everything works before launch. This guide walks you through the most important tests in order of priority.

---

## 📋 Testing Checklist

### ⚡ CRITICAL TESTS (Required - 45 minutes)

#### 1. Security Testing (20 minutes) 🔒

**Why:** Verify XSS protection is working

**Test XSS Protection in Task Title:**
```
1. Click "Add Task" button
2. In the title field, type: <script>alert('XSS')</script>
3. Fill other fields and save
4. EXPECT: No alert popup, task created with sanitized title
5. [ ] PASS  [ ] FAIL
```

**Test XSS Protection in Comment:**
```
1. Open any task details
2. Add comment: <img src=x onerror=alert('XSS')>
3. EXPECT: No alert popup, comment saved without dangerous HTML
4. [ ] PASS  [ ] FAIL
```

**Test XSS Protection in User Name:**
```
1. Open Users Management
2. Create user with name: <b>Test</b>User
3. EXPECT: Name displays as "TestUser" (no bold formatting)
4. [ ] PASS  [ ] FAIL
```

**Test File Upload Sanitization:**
```
1. Open a task
2. Try to upload a file named: <script>test</script>.pdf
3. EXPECT: Filename sanitized to safe characters
4. [ ] PASS  [ ] FAIL
```

**Test Permission Enforcement:**
```
1. If possible, switch to a "member" role user
2. Try to access Users Management
3. EXPECT: Should not see admin features or get error
4. [ ] PASS  [ ] FAIL  [ ] SKIP (can't test different users)
```

**Security Test Results:**
- Total Tests: 5
- Passed: ___
- Failed: ___
- **Required:** All 5 must pass

---

#### 2. Core Task Flow (10 minutes) ✅

**Create Task:**
```
1. Click "Add Task"
2. Fill in:
   - Title: "Test Task 1"
   - Description: "This is a test"
   - Assign to any employee
   - Priority: High
   - Due date: Tomorrow
3. Click Save
4. EXPECT: Task appears in list, toast notification shows
5. [ ] PASS  [ ] FAIL
```

**Edit Task:**
```
1. Click on the task you just created
2. Click edit button (pencil icon)
3. Change title to "Test Task 1 - Updated"
4. Click Save
5. EXPECT: Task updates, activity history shows change
6. [ ] PASS  [ ] FAIL
```

**Add Comment:**
```
1. Open task details
2. Add comment: "This is a test comment"
3. Click Add Comment
4. EXPECT: Comment appears, activity history updated
5. [ ] PASS  [ ] FAIL
```

**Upload Attachment:**
```
1. In task details, click "Upload Attachment"
2. Select any file under 10MB
3. EXPECT: File uploads, appears in attachments list
4. [ ] PASS  [ ] FAIL
```

**Change Task Status:**
```
1. Open task or use quick status change
2. Change status to "Completed"
3. EXPECT: Confetti animation, toast notification
4. [ ] PASS  [ ] FAIL
```

**Delete Task:**
```
1. Click delete button on a task
2. Confirm deletion
3. EXPECT: Task removed, toast notification
4. [ ] PASS  [ ] FAIL
```

**Task Flow Results:**
- Total Tests: 6
- Passed: ___
- Failed: ___
- **Required:** At least 5/6 must pass

---

#### 3. Data Persistence (5 minutes) 💾

**Test Data Survives Refresh:**
```
1. Note current number of tasks
2. Press F5 to refresh the page
3. EXPECT: All tasks still there, count unchanged
4. [ ] PASS  [ ] FAIL
```

**Test Export/Import:**
```
1. Click Data Management icon (database icon)
2. Click "Export Data"
3. Save the JSON file
4. Count your current tasks: ___ tasks
5. Create 2 new dummy tasks
6. Click "Import Data"
7. Select the JSON file you exported
8. Choose "Replace" option
9. EXPECT: Back to original task count
10. [ ] PASS  [ ] FAIL
```

**Persistence Results:**
- Total Tests: 2
- Passed: ___
- Failed: ___
- **Required:** Both must pass

---

#### 4. Employee Management (5 minutes) 👥

**Create Employee:**
```
1. Click Users Management (people icon)
2. Click "Add Team Member"
3. Fill in:
   - Name: "Test User"
   - Role: "Developer"
   - User Role: "Team Member"
   - Department: Select existing or type new
4. Click Add
5. EXPECT: Employee appears in list
6. [ ] PASS  [ ] FAIL
```

**Assign to Multiple Departments:**
```
1. Edit the employee you created
2. Add to 2-3 departments (use quick select buttons)
3. Save
4. EXPECT: Multiple department badges show
5. [ ] PASS  [ ] FAIL
```

**Delete Employee:**
```
1. Delete the test employee
2. Confirm deletion
3. EXPECT: Employee removed, any assigned tasks unassigned
4. [ ] PASS  [ ] FAIL
```

**Employee Results:**
- Total Tests: 3
- Passed: ___
- Failed: ___
- **Required:** All 3 must pass

---

#### 5. Notifications (5 minutes) 🔔

**Test In-App Notification:**
```
1. Create a task and assign to someone
2. Check notification bell icon (top right)
3. EXPECT: Notification count increases
4. Click bell to see notifications
5. EXPECT: New notification about task assignment
6. [ ] PASS  [ ] FAIL
```

**Test Desktop Notification:**
```
1. Click Desktop Notification Settings
2. Click "Request Permission"
3. Allow notifications when browser prompts
4. Click "Test Desktop Notification"
5. EXPECT: OS notification appears
6. [ ] PASS  [ ] FAIL  [ ] SKIP (notifications blocked)
```

**Test Notification Preferences:**
```
1. Click Notification Preferences (bell with gear)
2. Disable "Task Assignment" notifications
3. Create a new assigned task
4. EXPECT: No notification for assignment
5. Re-enable the setting
6. [ ] PASS  [ ] FAIL
```

**Notification Results:**
- Total Tests: 3
- Passed: ___
- Failed: ___
- **Required:** At least 2/3 must pass

---

### 🟡 IMPORTANT TESTS (Recommended - 15 minutes)

#### 6. Department Management (10 minutes) 🏢

**Create Custom Department:**
```
1. Click Department Management
2. Click "Create Custom" tab
3. Enter name: "Test Department"
4. Select a color
5. Click Create
6. EXPECT: Department appears in active list
7. [ ] PASS  [ ] FAIL
```

**Use Template:**
```
1. Go to "Templates" tab
2. Click "Use Template" on "Engineering" (or any)
3. EXPECT: Engineering department created
4. [ ] PASS  [ ] FAIL
```

**Edit Department:**
```
1. Click edit on "Test Department"
2. Change name to "Test Dept Updated"
3. Save
4. EXPECT: Name updates everywhere
5. [ ] PASS  [ ] FAIL
```

**Try to Delete with Employees:**
```
1. Assign an employee to "Test Dept Updated"
2. Try to delete the department
3. EXPECT: Error message, cannot delete
4. [ ] PASS  [ ] FAIL
```

**Archive Department:**
```
1. Remove all employees from "Test Dept Updated"
2. Click archive button
3. EXPECT: Moves to "Archived Departments" section
4. [ ] PASS  [ ] FAIL
```

**Restore Department:**
```
1. In Archived section, click restore
2. EXPECT: Moves back to active list
3. [ ] PASS  [ ] FAIL
```

**Department Results:**
- Total Tests: 6
- Passed: ___
- Failed: ___
- **Required:** At least 5/6 should pass

---

#### 7. AI Features (5 minutes) 🤖

**AI Assistant:**
```
1. Click "AI Assistant" button
2. Type: "Suggest a high priority task"
3. Wait for response
4. EXPECT: AI generates a task suggestion
5. Click "Apply Suggestion" (if available)
6. [ ] PASS  [ ] FAIL  [ ] SKIP (no AI access)
```

**Auto-Assign:**
```
1. Create 3 unassigned tasks
2. Click "Auto-Assign Tasks"
3. Preview assignments
4. Click Apply
5. EXPECT: Tasks assigned to employees
6. [ ] PASS  [ ] FAIL  [ ] SKIP (no AI access)
```

**AI Results:**
- Total Tests: 2
- Passed: ___
- Failed: ___
- **Note:** Can skip if AI features not enabled

---

### 🔵 OPTIONAL TESTS (Nice to Have - 20 minutes)

#### 8. Bulk Operations (5 minutes)

```
1. Create 5 test tasks
2. Click "Bulk Select" button
3. Check 3 tasks
4. Click "Complete" in bulk toolbar
5. EXPECT: 3 tasks marked complete
6. [ ] PASS  [ ] FAIL
```

---

#### 9. Announcements (5 minutes)

```
1. Click Announcements icon
2. Create announcement
3. Edit the announcement
4. Delete the announcement
5. [ ] PASS  [ ] FAIL
```

---

#### 10. Browser Compatibility (10 minutes)

**Test in Chrome:**
```
1. Open app in Chrome
2. Create a task
3. Check for console errors (F12)
4. [ ] PASS  [ ] FAIL
```

**Test in Firefox:**
```
1. Open app in Firefox
2. Create a task
3. Check for console errors
4. [ ] PASS  [ ] FAIL
```

**Test in Safari (if Mac):**
```
1. Open app in Safari
2. Create a task
3. Check for console errors
4. [ ] PASS  [ ] FAIL
```

---

## 📊 TEST RESULTS SUMMARY

### Critical Tests (Required)
- [ ] Security Testing: ___/5 passed
- [ ] Core Task Flow: ___/6 passed
- [ ] Data Persistence: ___/2 passed
- [ ] Employee Management: ___/3 passed
- [ ] Notifications: ___/3 passed

**Total Critical: ___/19 passed**

### Important Tests (Recommended)
- [ ] Department Management: ___/6 passed
- [ ] AI Features: ___/2 passed

**Total Important: ___/8 passed**

### Overall Pass Rate: ___%

---

## ✅ LAUNCH DECISION

### ✅ READY TO LAUNCH IF:
- [ ] Security Testing: 5/5 passed
- [ ] Core Task Flow: 5/6 or better
- [ ] Data Persistence: 2/2 passed
- [ ] Employee Management: 3/3 passed
- [ ] Notifications: 2/3 or better
- [ ] No critical console errors
- [ ] **Overall: 17/19 or better**

### ⚠️ NEEDS ATTENTION IF:
- Security tests failed: **DO NOT LAUNCH**
- Data persistence failed: **DO NOT LAUNCH**
- Less than 15/19 critical tests passed: **FIX ISSUES FIRST**

### 🚀 LAUNCH APPROVED
- [ ] All critical tests passed (17/19 minimum)
- [ ] No security failures
- [ ] Data persistence working
- [ ] No blocking console errors
- [ ] Ready to proceed

---

## 🐛 ISSUE REPORTING

If any test fails, document here:

**Test #:** ___  
**Test Name:** _________________  
**What Happened:** _________________  
**Expected:** _________________  
**Console Errors:** _________________  
**Browser:** _________________  
**Screenshots:** (attach if possible)

---

**Repeat for each failure**

---

## 📝 NOTES

Use this space for any observations during testing:

---

## ✅ COMPLETION

**Tested By:** _________________  
**Date:** _________________  
**Time Spent:** _________________  
**Overall Result:** [ ] PASS  [ ] FAIL  [ ] NEEDS FIXES  

**Ready for Launch:** [ ] YES  [ ] NO  [ ] WITH FIXES

---

## 🚀 NEXT STEPS

### If All Tests Passed:
1. ✅ Mark testing complete
2. 📋 Review PRE_LAUNCH_CHECKLIST.md
3. ⚙️ Set up production configuration
4. 🚀 Proceed with deployment

### If Tests Failed:
1. 📝 Document all failures above
2. 🔍 Review error messages
3. 💬 Report issues for fixing
4. 🔄 Retest after fixes
5. ✅ Must pass before launch

---

**Good luck with testing! 🎉**

*Estimated completion time: 45-60 minutes*  
*Last updated: December 2024*
