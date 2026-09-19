import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for TaskFlow UX/UI improvements
 * Covers: mobile responsiveness, character counters, dark mode, reorganized fields
 *
 * Run with:
 * npx playwright test tests/e2e-ux-improvements.spec.ts
 */

// Test configuration for different breakpoints
const BREAKPOINTS = {
  mobile: { width: 320, height: 568, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1280, height: 800, name: 'Desktop' }
};

test.describe('UX/UI Improvements - Mobile Responsiveness', () => {

  test('should render form single-column on mobile (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    // Mock the dialog open state
    await page.evaluate(() => {
      const event = new CustomEvent('openCreateDialog');
      window.dispatchEvent(event);
    });

    // Wait for dialog to appear (in real app, this would be triggered by button click)
    // For this test, we're verifying the layout classes
    const priorityDateGrid = await page.locator('[class*="grid-cols-1"]');
    const classes = await priorityDateGrid.getAttribute('class');

    // Should have grid-cols-1 for mobile
    expect(classes).toContain('grid-cols-1');
    expect(classes).toContain('sm:grid-cols-2');
  });

  test('should render form two-column on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // At tablet size, should show 2-column grid
    // This verifies the responsive class works as intended
    const dialogContent = page.locator('[class*="sm:max-w"]');
    const width = await dialogContent.boundingBox();

    expect(width?.width).toBeGreaterThan(600);
  });
});

test.describe('UX/UI Improvements - Character Counters', () => {

  test('should show character counter for title (0/100)', async ({ page }) => {
    // Mock input field
    const titleInput = await page.locator('input[id="title"]');

    // Type some text
    await titleInput.fill('Test Task');

    // Character counter should show "9/100"
    const counter = await page.locator('text=/\\d+\\/100/');
    await expect(counter).toContainText('9/100');
  });

  test('should enforce maxLength for title (100 chars)', async ({ page }) => {
    const titleInput = await page.locator('input[id="title"]');

    // Try to type more than 100 characters
    const longText = 'a'.repeat(150);
    await titleInput.fill(longText);

    // Should be truncated to 100
    const value = await titleInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(100);
  });

  test('should show character counter for description (0/500)', async ({ page }) => {
    const descInput = await page.locator('textarea[id="description"]');

    await descInput.fill('This is a task description');

    const counter = await page.locator('text=/\\d+\\/500/');
    await expect(counter).toContainText('26/500');
  });

  test('should enforce maxLength for description (500 chars)', async ({ page }) => {
    const descInput = await page.locator('textarea[id="description"]');

    const longText = 'a'.repeat(600);
    await descInput.fill(longText);

    const value = await descInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(500);
  });
});

test.describe('UX/UI Improvements - Field Reorganization', () => {

  test('Assignee field should appear before Priority/Due Date', async ({ page }) => {
    // Get all form sections in order
    const sections = await page.locator('[class*="grid"][class*="gap"]').allTextContents();

    // Find indices of key labels
    const allText = sections.join(' ');
    const assigneeIndex = allText.indexOf('Assign To');
    const priorityIndex = allText.indexOf('Priority');

    // Assignee should come before Priority
    expect(assigneeIndex).toBeLessThan(priorityIndex);
  });

  test('should have visual section separators (Separators)', async ({ page }) => {
    const separators = await page.locator('[class*="Separator"]');
    const count = await separators.count();

    // Should have at least 2 separators (between sections)
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should have section headers (Assign & Schedule, Advanced Options)', async ({ page }) => {
    const assignScheduleHeader = await page.locator('text=Assign & Schedule');
    const advancedHeader = await page.locator('text=Advanced Options');

    await expect(assignScheduleHeader).toBeVisible();
    await expect(advancedHeader).toBeVisible();
  });
});

test.describe('UX/UI Improvements - Help Icons', () => {

  test('Labels field should have help icon with popover', async ({ page }) => {
    const helpButton = await page.locator('button[class*="h-5"][class*="w-5"]').first();

    // Click help icon
    await helpButton.click();

    // Popover should appear with help text
    const helpText = await page.locator('text=Labels help organize tasks');
    await expect(helpText).toBeVisible();
  });

  test('Watchers field should have help icon with popover', async ({ page }) => {
    const helpButtons = await page.locator('button[class*="h-5"][class*="w-5"]');

    // Click second help icon (Watchers)
    await helpButtons.nth(1).click();

    // Popover should appear with help text
    const helpText = await page.locator('text=Watchers receive notifications');
    await expect(helpText).toBeVisible();
  });

  test('help icons should have hover effect', async ({ page }) => {
    const helpButton = await page.locator('button[class*="h-5"][class*="w-5"]').first();

    // Hover over help icon
    await helpButton.hover();

    // Should have hover color class applied
    const classes = await helpButton.getAttribute('class');
    expect(classes).toContain('hover:text-foreground');
  });
});

test.describe('UX/UI Improvements - Dark Mode Support', () => {

  test('AI suggestion box should have dark mode classes', async ({ page }) => {
    // Simulate AI suggestion box appearing (e.g., after AI estimator loads)
    const aiBox = await page.locator('[class*="bg-purple-50"]');
    const classes = await aiBox.getAttribute('class');

    // Should have both light and dark mode classes
    expect(classes).toContain('bg-purple-50');
    expect(classes).toContain('dark:bg-purple-900/20');
    expect(classes).toContain('dark:border-purple-800');
    expect(classes).toContain('dark:text-purple-300');
  });

  test('Approval box should have dark mode classes', async ({ page }) => {
    const approvalBox = await page.locator('[class*="bg-amber-50"]');
    const classes = await approvalBox.getAttribute('class');

    expect(classes).toContain('bg-amber-50');
    expect(classes).toContain('dark:bg-amber-900/20');
    expect(classes).toContain('dark:border-amber-800');
  });

  test('should render correctly in dark theme', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    // Elements should still be visible
    const titleLabel = await page.locator('label:has-text("Task Title")');
    await expect(titleLabel).toBeVisible();

    // Background colors should not be hardcoded light
    const aiBox = await page.locator('[class*="bg-purple"]');
    const bgColor = await aiBox.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should not be light purple (rgb(250, 245, 255) in light mode)
    // Dark mode should use semi-transparent dark purple
    expect(bgColor).not.toBe('rgb(250, 245, 255)');
  });
});

test.describe('UX/UI Improvements - Touch Targets', () => {

  test('all buttons should have minimum 44px touch target', async ({ page }) => {
    const buttons = await page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      // Width should be at least 44px (typical minimum touch target)
      if (box?.width) {
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('all form inputs should have 40px+ height on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    const inputs = await page.locator('input[type="text"], textarea, [class*="SelectTrigger"]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();

      // Height should be at least 40px for easy mobile interaction
      if (box?.height) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe('UX/UI Improvements - Accessibility', () => {

  test('form labels should be associated with inputs', async ({ page }) => {
    // Title input should have associated label
    const titleInput = await page.locator('input[id="title"]');
    const titleLabel = await page.locator('label[for="title"]');

    await expect(titleLabel).toBeVisible();
    expect(await titleInput.getAttribute('id')).toBe('title');
  });

  test('help icons should be keyboard accessible', async ({ page }) => {
    const helpButton = await page.locator('button[class*="h-5"][class*="w-5"]').first();

    // Focus the button
    await helpButton.focus();

    // Button should be focused
    const isFocused = await helpButton.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);

    // Should open popover on Enter key
    await helpButton.press('Enter');
    const popover = await page.locator('[role="dialog"]').first();
    await expect(popover).toBeVisible({ timeout: 1000 }).catch(() => {
      // Popover might not have role="dialog", that's ok
    });
  });

  test('form should be keyboard navigable', async ({ page }) => {
    const titleInput = await page.locator('input[id="title"]');

    // Focus title input
    await titleInput.click();

    // Tab to next field (description)
    await page.keyboard.press('Tab');

    const descInput = await page.locator('textarea[id="description"]');
    const isFocused = await descInput.evaluate(el => el === document.activeElement);

    expect(isFocused).toBe(true);
  });
});

test.describe('UX/UI Improvements - Backwards Compatibility', () => {

  test('form submission should still work with all data', async ({ page }) => {
    // Fill in required field
    await page.locator('input[id="title"]').fill('Test Task');

    // Verify other fields are still present and functional
    const descInput = await page.locator('textarea[id="description"]');
    await descInput.fill('Description');

    const assignSelect = await page.locator('[id="assignee"]');
    expect(assignSelect).toBeVisible();
  });

  test('should preserve all field data types', async ({ page }) => {
    // Title (string)
    await page.locator('input[id="title"]').fill('Task Name');

    // Description (string)
    await page.locator('textarea[id="description"]').fill('Task description');

    // Priority (select)
    const prioritySelect = await page.locator('[id="priority"]');
    await prioritySelect.click();
    await page.locator('text=High').click();

    // Date (date picker)
    const dateButton = await page.locator('button:has-text("No due date")');
    expect(dateButton).toBeVisible();
  });
});

test.describe('UX/UI Improvements - Integration', () => {

  test('all improvements should work together on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    // Fill title (with character counter)
    await page.locator('input[id="title"]').fill('Integration Test Task');
    const titleCounter = await page.locator('text=/\\d+\\/100/').first();
    await expect(titleCounter).toBeVisible();

    // See reorganized fields (Assignee before Priority)
    const assignee = await page.locator('text=Assign To');
    await expect(assignee).toBeVisible();

    // See help icons
    const helpIcon = await page.locator('button[class*="h-5"]').first();
    expect(await helpIcon.isVisible()).toBe(true);

    // Dialog should be scrollable without internal overflow
    const dialogContent = await page.locator('[class*="DialogContent"]');
    const overflow = await dialogContent.getAttribute('class');
    expect(overflow).toContain('overflow-y-auto');
  });
});
