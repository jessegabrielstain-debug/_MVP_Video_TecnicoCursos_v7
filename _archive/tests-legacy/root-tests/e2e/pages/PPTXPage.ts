import { Page, Locator, expect } from '@playwright/test';
import path from 'path';

export class PPTXPage {
  readonly page: Page;
  readonly fileInput: Locator;
  readonly startProcessingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fileInput = page.locator('input[type="file"]');
    this.startProcessingButton = page.getByRole('button', { name: 'Iniciar Processamento' });
  }

  async goto() {
    await this.page.goto('/pptx');
  }

  async expectLoaded() {
    await expect(this.page.getByRole('heading', { name: 'Processamento PPTX' })).toBeVisible();
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async uploadBuffer(name: string, mimeType: string, buffer: Buffer) {
    await this.fileInput.setInputFiles({
      name,
      mimeType,
      buffer
    });
  }

  async startProcessing() {
    await this.startProcessingButton.click();
  }

  async expectSuccessMessage() {
    await expect(this.page.getByText('Upload concluído com sucesso!')).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
