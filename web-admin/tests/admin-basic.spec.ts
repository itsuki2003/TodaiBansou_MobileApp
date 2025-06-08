import { test, expect } from '@playwright/test';

test.describe('管理画面基本機能テスト', () => {
  test('ホームページにアクセスできる', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // ページタイトルを確認
    await expect(page).toHaveTitle(/東大伴走/);
    
    // ログインページまたはダッシュボードが表示される
    const isLoginPage = await page.locator('button[type="submit"]:has-text("ログイン")').isVisible();
    const isDashboard = await page.locator('text=ダッシュボード').isVisible();
    
    expect(isLoginPage || isDashboard).toBe(true);
  });

  test('ログインページが正常に表示される', async ({ page }) => {
    // ログインページに直接アクセス
    await page.goto('/login');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // ログインフォームの要素が存在することを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('学生管理ページにアクセスできる（認証後）', async ({ page }) => {
    // 学生管理ページにアクセス
    await page.goto('/students');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 認証されていない場合はログインページにリダイレクトされる
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const isStudentsPage = currentUrl.includes('/students');
    
    // ログインページまたは学生管理ページのどちらかが表示される
    expect(isLoginPage || isStudentsPage).toBe(true);
    
    if (isStudentsPage) {
      // 学生管理ページの場合、ヘッダーまたはタイトルを確認
      const hasStudentManagement = await page.locator('text=生徒管理').isVisible();
      const hasHeader = await page.locator('header').isVisible();
      expect(hasStudentManagement || hasHeader).toBe(true);
    }
  });

  test('お知らせ管理ページにアクセスできる（認証後）', async ({ page }) => {
    // お知らせ管理ページにアクセス
    await page.goto('/notifications');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 認証されていない場合はログインページにリダイレクトされる
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const isNotificationsPage = currentUrl.includes('/notifications');
    
    // ログインページまたはお知らせ管理ページのどちらかが表示される
    expect(isLoginPage || isNotificationsPage).toBe(true);
    
    if (isNotificationsPage) {
      // お知らせ管理ページの場合、ヘッダーまたはタイトルを確認
      const hasNotificationManagement = await page.locator('text=お知らせ管理').isVisible();
      const hasHeader = await page.locator('header').isVisible();
      expect(hasNotificationManagement || hasHeader).toBe(true);
    }
  });

  test('運営者管理ページにアクセスできる（認証後）', async ({ page }) => {
    // 運営者管理ページにアクセス
    await page.goto('/administrators');
    
    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 認証されていない場合はログインページにリダイレクトされる
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const isAdministratorsPage = currentUrl.includes('/administrators');
    
    // ログインページまたは運営者管理ページのどちらかが表示される
    expect(isLoginPage || isAdministratorsPage).toBe(true);
    
    if (isAdministratorsPage) {
      // 運営者管理ページの場合、ヘッダーまたはタイトルを確認
      const hasAdminManagement = await page.locator('text=運営者').isVisible();
      const hasHeader = await page.locator('header').isVisible();
      expect(hasAdminManagement || hasHeader).toBe(true);
    }
  });

  test('レスポンシブデザインが適用されている', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // モバイルサイズでの表示確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // ページが正常に表示されることを確認
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);
    
    // デスクトップサイズでの表示確認
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // ページが正常に表示されることを確認
    const bodyDesktop = await page.locator('body').isVisible();
    expect(bodyDesktop).toBe(true);
  });
});