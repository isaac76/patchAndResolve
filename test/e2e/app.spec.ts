import { test, expect } from '@playwright/test';

test.describe('PatchManager Component', () => {
  test('should display the patch merge demo', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Patch and Resolve/);

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Patch Merge Demo' })).toBeVisible();

    // Check for description
    await expect(page.getByText(/Merge multiple remote patches into a local patch/)).toBeVisible();

    // Check for local patch textarea
    await expect(page.getByRole('heading', { name: 'Local Patch (Your Changes)' })).toBeVisible();

    // Check for remote patches section
    await expect(page.getByRole('heading', { name: 'Remote Patches (From Server)' })).toBeVisible();

    // Check for merge button
    await expect(page.getByRole('button', { name: 'Merge Patches' })).toBeVisible();
  });

  test('should merge non-conflicting patches successfully', async ({ page }) => {
    await page.goto('/');

    // Get the local patch textarea (first textarea)
    const localTextarea = page.locator('textarea').first();

    // Get remote patch textareas
    const remote1Textarea = page.locator('textarea').nth(1);
    const remote2Textarea = page.locator('textarea').nth(2);

    // Set non-conflicting patches
    await localTextarea.fill(JSON.stringify({ version: 15, message: 'Local changes', x: 100 }, null, 2));
    await remote1Textarea.fill(JSON.stringify({ version: 16, y: 200 }, null, 2));
    await remote2Textarea.fill(JSON.stringify({ version: 17, z: 300 }, null, 2));

    // Click merge button
    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Should show success message
    await expect(page.getByText('✓ Merged Successfully!')).toBeVisible();

    // Should display merged result in the success box
    const successBox = page.locator('div').filter({ hasText: '✓ Merged Successfully!' });
    await expect(successBox.locator('pre')).toContainText('Local changes');
    await expect(successBox.locator('pre')).toContainText('"version": 17');
  });

  test('should detect and display conflicts', async ({ page }) => {
    await page.goto('/');

    // Get textareas
    const localTextarea = page.locator('textarea').first();
    const remoteTextarea = page.locator('textarea').nth(1);

    // Set conflicting patches (both modify 'message')
    await localTextarea.fill(JSON.stringify({ version: 15, message: 'Local version' }, null, 2));
    await remoteTextarea.fill(JSON.stringify({ version: 16, message: 'Remote version' }, null, 2));

    // Click merge button
    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Should show conflict warning
    await expect(page.getByText(/1 Conflict Detected/)).toBeVisible();
    await expect(page.getByText(/A modal will help you resolve them one at a time/)).toBeVisible();
  });

  test('should open conflict modal and navigate through conflicts', async ({ page }) => {
    await page.goto('/');

    const localTextarea = page.locator('textarea').first();
    const remoteTextarea = page.locator('textarea').nth(1);

    // Set patches with multiple conflicts
    await localTextarea.fill(JSON.stringify({ version: 15, text: 'Local text', color: 'blue' }, null, 2));
    await remoteTextarea.fill(JSON.stringify({ version: 16, text: 'Remote text', color: 'red' }, null, 2));

    // Click merge button
    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Modal should appear
    const modal = page.locator('div').filter({ hasText: 'Patch Conflict Resolution' }).first();
    await expect(modal.getByRole('heading', { name: 'Patch Conflict Resolution' })).toBeVisible();

    // Should show conflict counter
    await expect(modal.getByText('Conflict 1 of 2')).toBeVisible();

    // Should show field name
    await expect(modal.getByText(/Field:/)).toBeVisible();

    // Should have Local/Remote labels
    await expect(modal.getByRole('heading', { name: 'Local Value' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Remote Value' })).toBeVisible();

    // Should have navigation buttons
    await expect(page.getByRole('button', { name: '← Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Finish/ })).toBeVisible();
  });

  test('should resolve single conflict', async ({ page }) => {
    await page.goto('/');

    const localTextarea = page.locator('textarea').first();
    const remoteTextarea = page.locator('textarea').nth(1);

    // Set patches with single conflict
    await localTextarea.fill(JSON.stringify({ version: 15, message: 'Keep local', x: 100 }, null, 2));
    await remoteTextarea.fill(JSON.stringify({ version: 16, message: 'From remote', y: 200 }, null, 2));

    // Click merge button
    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Wait for modal
    await expect(page.getByRole('heading', { name: 'Patch Conflict Resolution' })).toBeVisible();

    // Click "Use Local"
    await page.getByRole('button', { name: 'Use Local' }).click();

    // Finish button should become enabled
    const finishButton = page.getByRole('button', { name: /Finish \(1\/1\)/ });
    await expect(finishButton).toBeEnabled();

    // Click Finish
    await finishButton.click();

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Patch Conflict Resolution' })).not.toBeVisible();

    // Should show merged result
    await expect(page.getByText('✓ Merged Successfully!')).toBeVisible();
    const successBox = page.locator('div').filter({ hasText: '✓ Merged Successfully!' });
    await expect(successBox.locator('pre')).toContainText('Keep local');
  });

  test('should navigate through multiple conflicts', async ({ page }) => {
    await page.goto('/');

    const localTextarea = page.locator('textarea').first();
    const remoteTextarea = page.locator('textarea').nth(1);

    // Set patches with two conflicts
    await localTextarea.fill(JSON.stringify({ version: 15, a: 'local-a', b: 'local-b' }, null, 2));
    await remoteTextarea.fill(JSON.stringify({ version: 16, a: 'remote-a', b: 'remote-b' }, null, 2));

    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Should show first conflict
    await expect(page.getByText('Conflict 1 of 2')).toBeVisible();

    // Select local for first conflict
    await page.getByRole('button', { name: 'Use Local' }).click();

    // Previous should be disabled on first conflict
    await expect(page.getByRole('button', { name: '← Previous' })).toBeDisabled();

    // Next should be enabled after making selection
    const nextButton = page.getByRole('button', { name: 'Next →' });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Should show second conflict
    await expect(page.getByText('Conflict 2 of 2')).toBeVisible();

    // Previous should now be enabled
    await expect(page.getByRole('button', { name: '← Previous' })).toBeEnabled();

    // Select remote for second conflict
    await page.getByRole('button', { name: 'Use Remote' }).click();

    // Finish should be enabled after all conflicts resolved
    const finishButton = page.getByRole('button', { name: /Finish \(2\/2\)/ });
    await expect(finishButton).toBeEnabled();
    await finishButton.click();

    // Should show success
    await expect(page.getByText('✓ Merged Successfully!')).toBeVisible();
  });

  test('should handle multiple remote patches', async ({ page }) => {
    await page.goto('/');

    const localTextarea = page.locator('textarea').first();

    // Set local patch
    await localTextarea.fill(JSON.stringify({ version: 15, message: 'Local' }, null, 2));

    // Click Add Patch button to add more remote patches
    const addButton = page.getByRole('button', { name: '+ Add Patch' });
    await addButton.click();

    // Should now have 3 remote patch textareas
    const textareas = page.locator('textarea');
    await expect(textareas).toHaveCount(4); // 1 local + 3 remote

    // Fill remote patches
    const remote1 = textareas.nth(1);
    const remote2 = textareas.nth(2);
    const remote3 = textareas.nth(3);

    await remote1.fill(JSON.stringify({ version: 16, x: 100 }, null, 2));
    await remote2.fill(JSON.stringify({ version: 17, y: 200 }, null, 2));
    await remote3.fill(JSON.stringify({ version: 18, z: 300 }, null, 2));

    // Merge all
    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Should merge successfully
    await expect(page.getByText('✓ Merged Successfully!')).toBeVisible();
    const successBox = page.locator('div').filter({ hasText: '✓ Merged Successfully!' });
    await expect(successBox.locator('pre')).toContainText('"version": 18');
    await expect(successBox.locator('pre')).toContainText('"x": 100');
    await expect(successBox.locator('pre')).toContainText('"y": 200');
    await expect(successBox.locator('pre')).toContainText('"z": 300');
  });

  test('should handle version numbers correctly', async ({ page }) => {
    await page.goto('/');

    const localTextarea = page.locator('textarea').first();
    const remote1Textarea = page.locator('textarea').nth(1);
    const remote2Textarea = page.locator('textarea').nth(2);

    // Set patches with different versions (non-conflicting)
    await localTextarea.fill(JSON.stringify({ version: 3, message: 'Local' }, null, 2));
    await remote1Textarea.fill(JSON.stringify({ version: 7, imageId: 'img123' }, null, 2));
    await remote2Textarea.fill(JSON.stringify({ version: 5, extra: 'data' }, null, 2));

    // Click merge button
    await page.getByRole('button', { name: 'Merge Patches' }).click();

    // Should merge successfully
    await expect(page.getByText('✓ Merged Successfully!')).toBeVisible();

    // Should use higher version (7)
    const successBox = page.locator('div').filter({ hasText: '✓ Merged Successfully!' });
    await expect(successBox.locator('pre')).toContainText('"version": 7');
  });
});
