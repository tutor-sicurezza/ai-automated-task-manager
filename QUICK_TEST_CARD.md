# ⚡ QUICK TEST CARD - Print & Check Off

**Test Date:** ___________  **Tester:** ___________  **Browser:** ___________

---

## 🎯 10 TESTS - CHECK AS YOU GO

### □ Test 1: Create "Engineering"
1. Click **Departments** (top right)
2. Click **Add Department**
3. Name: `Engineering`, pick color
4. Click **Create Department**
✅ **Expect:** Success toast

### □ Test 2: Use "Sales" Template
1. Click **Templates** button
2. Go to **Business** section
3. Click **Use Template** on **Sales**
4. Click **Create Department**
✅ **Expect:** Sales created with description

### □ Test 3: Bulk Create Tech Depts
1. In Templates, find **Technology**
2. Click **Create All (6)**
✅ **Expect:** 6 departments created

### □ Test 4: Edit Engineering → Engineering Team
1. Find **Engineering** in list
2. Click **pencil icon** (edit)
3. Change name to: `Engineering Team`
4. Click **Save Changes**
✅ **Expect:** Update success toast

### □ Test 5: Assign Employee to Engineering Team
1. Open **Users Management**
2. Edit/add an employee
3. Type **Eng** in Departments
4. Select **Engineering Team**
5. Save
✅ **Expect:** Badge shows on employee

### □ Test 6: View Engineering Team Details
1. In Departments list
2. Find **Engineering Team**
3. Click **list icon** (details)
✅ **Expect:** Shows members count + list

### □ Test 7: Try Delete Engineering Team (SHOULD FAIL)
1. Click **trash icon** on Engineering Team
2. Confirm
✅ **Expect:** ERROR - "Cannot delete with X employees"

### □ Test 8: Archive Empty Department
1. Create **Test Department** (no employees)
2. Click **warning icon** (archive)
3. Confirm
✅ **Expect:** Moves to Archived section

### □ Test 9: Restore Test Department
1. Find **Archived Departments**
2. Find **Test Department**
3. Click **Restore**
✅ **Expect:** Returns to Active list

### □ Test 10: Filter Tasks by Department
1. Go to **Tasks** view (top nav)
2. Open department filter
3. Select **Engineering Team**
✅ **Expect:** Shows only Engineering Team tasks

---

## ✓ POST-TEST CHECKS

□ No red errors in console (F12)  
□ Page refresh (F5) - data still there?  
□ Colors display correctly?  
□ All buttons work smoothly?

---

## 📊 RESULTS

**Passed:** _____ / 10

**Issues Found:**
_____________________________________
_____________________________________
_____________________________________

**Status:** □ Ready for Production  □ Needs Fixes

---

## 🆘 QUICK HELP

**Where's Departments?** → Top right, Buildings icon  
**Where's Users?** → Top right, multiple buttons  
**Where's Tasks?** → Top navigation bar  
**Console errors?** → Press F12, click Console tab  

**If test fails:** Note which test # and the error message

---

**KEEP THIS CARD HANDY DURING TESTING!** 📋
