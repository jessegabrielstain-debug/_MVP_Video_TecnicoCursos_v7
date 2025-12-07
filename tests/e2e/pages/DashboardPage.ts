import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly totalProjectsCard: Locator;
  readonly activeRendersCard: Locator;
  readonly templatesButton: Locator;
  readonly overviewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.totalProjectsCard = page.getByTestId('dashboard-card-total-projects');
    this.activeRendersCard = page.getByTestId('dashboard-card-active-renders');
    this.templatesButton = page.getByRole('button', { name: 'Templates' });
    this.overviewButton = page.getByRole('button', { name: 'Overview' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard$/);
    await expect(this.page.getByText('Dashboard overview and quick stats')).toBeVisible();
  }

  async expectStats(totalProjects: string, activeRenders: string) {
    await expect(this.totalProjectsCard.getByText(totalProjects)).toBeVisible();
    await expect(this.activeRendersCard.getByText(activeRenders)).toBeVisible();
  }

  async navigateToTemplates() {
    await this.templatesButton.click();
    await expect(this.page).toHaveURL(/\/dashboard\/templates/);
  }

  async navigateToOverview() {
    await this.overviewButton.click();
    await expect(this.page).toHaveURL(/\/dashboard$/);
  }
}
