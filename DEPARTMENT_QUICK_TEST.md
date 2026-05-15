# Department Operations - Quick Test Checklist

## 🎯 Quick Test (5 minutes)

Execute these operations in order to verify department system stability:

### ✅ Test 1: Create Department
1. Click **"Departments"** button (top right)
2. Click **"Add Department"**
3. Enter name: `Engineering`
4. Select a color (any color)
5. Click **"Create Department"**

**Expected:** Toast shows "Department 'Engineering' created successfully!"

---

### ✅ Test 2: Create with Template
1. In Departments dialog, click **"Templates"**
2. Find "Business" category
3. Click **"Use Template"** on "Sales" department
4. Click **"Create Department"**

**Expected:** Sales department created with pre-filled description and color

---

### ✅ Test 3: Bulk Create from Template
1. Click **"Templates"** again
2. On "Technology" category, click **"Create All (X)"**
3. Wait for toast notification

**Expected:** Multiple departments created at once

---

### ✅ Test 4: Edit Department
1. Find Engineering department
2. Click **edit icon** (pencil)
3. Change name to `Engineering Team`
4. Click **"Save Changes"**

**Expected:** Name updated, toast appears

---

### ✅ Test 5: Assign Employee to Department
1. Click **"Users Management"**
2. **Add** or **Edit** any employee
3. In "Departments" field, type `Eng` and select `Engineering Team`
4. Click **"Save"**

**Expected:** Employee shows department badge, department stats update

---

### ✅ Test 6: View Department Details
1. In Departments dialog, find Engineering Team
2. Click **list icon** (ListChecks)
3. View details dialog

**Expected:** Shows employee count and list of assigned employees

---

### ✅ Test 7: Attempt Delete with Employees
1. Try to click **trash icon** on Engineering Team
2. Confirm deletion

**Expected:** Error: "Cannot delete department with X assigned employee(s)"

---

### ✅ Test 8: Archive Department
1. Create a new test department (no employees)
2. Click **warning icon** on that department
3. Department moves to archived section

**Expected:** Department appears in "Archived Departments"

---

### ✅ Test 9: Restore Department
1. In archived section, click **"Restore"**
2. Department moves back to active

**Expected:** Department returns to active list

---

### ✅ Test 10: Department Filtering in Tasks
1. Create a task assigned to employee with department
2. Go to **Tasks** view
3. Use department filter dropdown
4. Select `Engineering Team`

**Expected:** Only shows tasks for employees in that department

---

## 🚨 Critical Checks

After all tests, verify:

- [ ] No console errors in browser DevTools
- [ ] All department counts are accurate
- [ ] Employee assignments persist after page refresh
- [ ] Colors display consistently everywhere
- [ ] Toast notifications appear for all actions
- [ ] No data was lost during operations

---

## 🐛 Common Issues

### Issue: Department not showing in filter
**Fix:** Assign at least one employee to the department

### Issue: Can't delete department
**Fix:** Remove all employee assignments first, or archive instead

### Issue: Duplicate department error
**Fix:** Check both active and archived departments for existing name

### Issue: Employee doesn't show department badge
**Fix:** Ensure `departments` array is populated (not just old `department` field)

---

## 📊 Integration Verification

After basic tests, verify integration points:

### Tasks View
- [ ] Department filter dropdown populated
- [ ] Filter works correctly
- [ ] Task cards show department badges
- [ ] Badge colors match department colors

### Analytics View
- [ ] Switch to "Departments" tab works
- [ ] All departments listed with stats
- [ ] Task counts accurate
- [ ] Charts render without errors

### User Management
- [ ] Can assign departments to employees
- [ ] Quick select buttons work
- [ ] Multiple departments support working
- [ ] Department field validates existing departments

### Department Color Legend
- [ ] Click "Department Colors" button
- [ ] Custom departments appear first
- [ ] Standard departments shown
- [ ] All color variants display correctly

---

## 🎨 Visual Checks

Verify department colors appear in:
- [ ] Department management cards
- [ ] Task cards (employee badges)
- [ ] Employee cards in user management
- [ ] Department analytics charts
- [ ] Department filter buttons
- [ ] Task details dialog
- [ ] Anywhere departments are referenced

---

## 💾 Data Persistence Test

1. Perform several operations (create, edit, assign)
2. **Export data** using Data Management
3. **Refresh the page** (F5)
4. Verify all changes persisted
5. **Clear browser cache** (Ctrl+Shift+Delete)
6. **Refresh again**
7. Verify data still intact (using Spark KV persistence)

---

## ✅ System Ready Indicators

Department system is stable and ready when:

- ✅ All 10 quick tests pass without errors
- ✅ No console errors during any operation
- ✅ Data persists across refreshes
- ✅ Employee-department relationships intact
- ✅ Colors render consistently
- ✅ Templates system works
- ✅ Archive/restore functions properly
- ✅ Edit/delete operations work as expected
- ✅ Integration with tasks/analytics working
- ✅ Performance is acceptable (< 1s for most operations)

---

## 🚀 Ready to Go Live?

If all checks pass:
1. ✅ Export current data as backup
2. ✅ Document any custom departments created
3. ✅ Brief team on department system
4. ✅ Monitor for first few days
5. ✅ Collect user feedback

---

## 📞 Testing Notes

**Test Date:** _______________

**Tested By:** _______________

**Issues Found:** 
- _________________________________
- _________________________________
- _________________________________

**Status:** 
- [ ] All tests passed - Ready for production
- [ ] Minor issues - Ready with notes
- [ ] Major issues - Not ready (list above)

**Additional Comments:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Est. Time:** 5-10 minutes for quick test, 20-30 minutes for comprehensive test
