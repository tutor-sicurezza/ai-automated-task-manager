# 🚀 DEPARTMENT TEST - QUICK EXECUTION GUIDE

**Time Required:** 5-10 minutes  
**Purpose:** Verify all 10 department operations work correctly before going live

---

## ⚡ QUICK START

### Open Your App
1. Open TaskFlow in your browser
2. Open Browser DevTools (F12) - watch the Console tab
3. Have this checklist ready

---

## 📋 THE 10 TESTS (Check off as you complete)

### [ ] Test 1: Create Department
**DO THIS:**
1. Click **"Departments"** button (Buildings icon, top right)
2. Click **"Add Department"**
3. Type name: `Engineering`
4. Click any color
5. Click **"Create Department"**

**EXPECT:** Green toast: "Department 'Engineering' created successfully!"  
**IF FAILS:** Note the error below

---

### [ ] Test 2: Use Template
**DO THIS:**
1. Click **"Templates"** tab
2. Scroll to "Business" section
3. Click **"Use Template"** on "Sales"
4. Click **"Create Department"**

**EXPECT:** Sales department created with description  
**IF FAILS:** Note the error below

---

### [ ] Test 3: Bulk Create
**DO THIS:**
1. Still in Templates tab
2. Find "Technology" section
3. Click **"Create All (6)"** button
4. Wait for processing

**EXPECT:** Toast: "Created X departments from Technology template"  
**IF FAILS:** Note the error below

---

### [ ] Test 4: Edit Department
**DO THIS:**
1. Find "Engineering" in list
2. Click **pencil icon** (edit)
3. Change name to: `Engineering Team`
4. Click **"Save Changes"**

**EXPECT:** Toast: "Department updated successfully!"  
**IF FAILS:** Note the error below

---

### [ ] Test 5: Assign Employee
**DO THIS:**
1. Click **"Users Management"** button
2. Add new employee OR edit existing
3. In "Departments" field, type: `Eng`
4. Select "Engineering Team"
5. Click **"Save"**

**EXPECT:** Employee shows Engineering Team badge  
**IF FAILS:** Note the error below

---

### [ ] Test 6: View Details
**DO THIS:**
1. Back to Departments dialog
2. Find "Engineering Team"
3. Click **list icon** (ListChecks)
4. Review the details shown

**EXPECT:** Shows employee count and list of members  
**IF FAILS:** Note the error below

---

### [ ] Test 7: Delete with Employees (Should Fail)
**DO THIS:**
1. Try to click **trash icon** on Engineering Team
2. Confirm deletion

**EXPECT:** Error toast: "Cannot delete department with X assigned employees"  
**IF FAILS (deletes anyway):** ⚠️ CRITICAL BUG - Note below

---

### [ ] Test 8: Archive Department
**DO THIS:**
1. Create new dept: `Test Department`
2. DON'T assign any employees
3. Click **warning icon** on Test Department
4. Confirm archive

**EXPECT:** Moves to "Archived Departments" section  
**IF FAILS:** Note the error below

---

### [ ] Test 9: Restore Department
**DO THIS:**
1. Find "Archived Departments" section
2. Find "Test Department"
3. Click **"Restore"** button

**EXPECT:** Returns to active departments list  
**IF FAILS:** Note the error below

---

### [ ] Test 10: Filter Tasks
**DO THIS:**
1. Go to **"Tasks"** view (top navigation)
2. Find department filter dropdown
3. Select "Engineering Team"

**EXPECT:** Only shows tasks for Engineering Team employees  
**IF FAILS:** Note the error below

---

## ✅ FINAL CHECKS

After completing all 10 tests:

### [ ] No Console Errors
- Open DevTools Console (F12)
- Should be no red errors
- Warnings are OK

### [ ] Data Persists
- Press F5 (refresh page)
- Departments still there?
- Employees still assigned?

### [ ] Colors Work
- All department badges show colors?
- Colors consistent everywhere?

---

## 📊 RESULT

**Passed:** _____ / 10 tests

**Console Errors:** [ ] Yes  [ ] No

**Data Persisted:** [ ] Yes  [ ] No

**Ready for Production:** [ ] Yes  [ ] No

---

## 🐛 ISSUES FOUND

List any problems here:

**Test #___ Issue:**
_________________________________

**Test #___ Issue:**
_________________________________

**Test #___ Issue:**
_________________________________

---

## 🎯 QUICK REFERENCE

**Where is the Departments button?**
→ Top right header, Buildings icon

**Where is Users Management?**
→ Top right header, multiple buttons

**Where is Tasks view?**
→ Top navigation bar, "Tasks" button

**How to see Console errors?**
→ Press F12, click Console tab

**How to refresh page?**
→ Press F5

---

## ✅ IF ALL PASSED

**Congrats! Your department system is working!**

Next steps:
1. ✅ Mark this checklist complete
2. ✅ Save/export your data (Data Management button)
3. ✅ Review PRE_LAUNCH_CHECKLIST.md
4. ✅ Proceed with deployment

---

## ⚠️ IF TESTS FAILED

**Don't deploy yet!**

Please report:
1. Which test(s) failed
2. What error appeared (screenshot)
3. What browser you're using
4. Any console errors (copy/paste)

Share this info for troubleshooting.

---

**Test Completed:** _______________

**Tested By:** _______________

**Browser Used:** _______________

**Overall Status:** _______________
