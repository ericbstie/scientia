import { test, expect, signIn, signOut, users, PASSWORD } from "./fixtures";

test.describe("Signing in and out", () => {
  test("@US-1 sign in with email and password", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await page.getByLabel("Email").fill(users.maya.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    await expect(page).toHaveURL(/\/sign-in/);

    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByLabel("Password").press("Enter");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("banner")).toContainText(users.maya.name);
  });

  test("@US-1 returns to the page you asked for after signing in", async ({ page }) => {
    await signIn(page, "maya");
    await page.getByRole("link", { name: "Introduction to Biology" }).click();
    await page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Assignments" }).click();
    const url = page.url();
    await signOut(page);
    await page.goto(url);
    await expect(page).toHaveURL(/\/sign-in\?next=/);
    await page.getByLabel("Email").fill(users.maya.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(url);
  });

  test("@US-2 sign out and keep pages private", async ({ page }) => {
    await signIn(page, "maya");
    await page.reload();
    await expect(page.getByRole("banner")).toContainText(users.maya.name);
    await page.getByRole("link", { name: "Modern European History" }).click();
    const his = page.url();
    await signOut(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/sign-in/);
    await page.goto(his);
    await expect(page).toHaveURL(/\/sign-in/);

    await signIn(page, "noah");
    await page.goto(his);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access to this course");
  });
});
