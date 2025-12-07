import { Page, Locator, expect } from '@playwright/test';

export class SystemControlPage {
  readonly page: Page;
  readonly validationTab: Locator;
  readonly configTab: Locator;
  readonly monitoringTab: Locator;
  readonly runAllButton: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.validationTab = page.getByRole('tab', { name: 'Validação' });
    this.configTab = page.getByRole('tab', { name: 'Configurações' });
    this.monitoringTab = page.getByRole('tab', { name: 'Monitoramento' });
    this.runAllButton = page.getByRole('button', { name: 'Executar Todos' });
    this.refreshButton = page.getByRole('button', { name: 'Atualizar' });
  }

  async goto() {
    await this.page.goto('/system-control');
  }

  async expectLoaded() {
    await expect(this.page.getByRole('heading', { name: /Controle do Sistema/i })).toBeVisible();
  }

  async openValidationTab() {
    await this.validationTab.click();
    await expect(this.page.getByRole('heading', { name: /Validador Funcional/i })).toBeVisible();
  }

  async runValidation() {
    const uploadTestRow = this.page.getByTestId('functional-test-pptx-upload-test');
    await expect(uploadTestRow.getByText('pending')).toBeVisible();
    
    await this.runAllButton.click();
    await expect(this.runAllButton).toBeDisabled();
    await expect(uploadTestRow.getByText('passed')).toBeVisible({ timeout: 10000 });
    await expect(this.runAllButton).toBeEnabled({ timeout: 12000 });
  }

  async openConfigTab() {
    await this.configTab.click();
    await expect(this.page.getByText('Configurações do Sistema')).toBeVisible();
  }

  async openMonitoringTabAndRefresh() {
    await this.monitoringTab.click();
    await this.refreshButton.click();
    await expect(this.refreshButton).toBeDisabled({ timeout: 2000 });
    await expect(this.refreshButton).toBeEnabled({ timeout: 5000 });
  }
}
