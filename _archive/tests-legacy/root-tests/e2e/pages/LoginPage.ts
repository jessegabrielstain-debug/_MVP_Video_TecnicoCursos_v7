import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Senha');
    this.submitButton = page.getByRole('button', { name: 'Entrar' });
    this.forgotPasswordLink = page.getByRole('button', { name: 'Esqueceu a senha?' });
    // Generic error message locator, can be refined based on specific error UI
    this.errorMessage = page.locator('.text-red-500, [role="alert"]'); 
  }

  async goto(params?: string) {
    await this.page.goto(`/login${params ? params : ''}`);
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectValidationErrors() {
    await expect(this.page.getByText('Email inválido')).toBeVisible();
    await expect(this.page.getByText('A senha deve ter pelo menos 6 caracteres')).toBeVisible();
  }
}
