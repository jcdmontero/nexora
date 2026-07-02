import { type Locator, type Page, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  readonly kpiCards:       Locator;
  readonly alertsSection:  Locator;
  readonly activityFeed:   Locator;
  readonly quickAccess:    Locator;
  readonly revenueChart:   Locator;
  readonly periodSelector: Locator;

  constructor(page: Page) {
    this.page           = page;
    // KPIs pueden ser cards numéricas en grid
    this.kpiCards       = page.locator('[data-testid="kpi-card"], [class*="kpi"], [class*="stat"]');
    this.alertsSection  = page.locator('text=Centro de Alertas').or(page.locator('text=Alertas')).first();
    this.activityFeed   = page.locator('text=Actividad reciente').or(page.locator('text=Actividad')).first();
    this.quickAccess    = page.locator('[data-testid="quick-access"], [class*="quick"]').first();
    this.revenueChart   = page.locator('canvas, [data-testid="revenue-chart"]').first();
    this.periodSelector = page.locator('[data-testid="period-selector"], select, button').filter({ hasText: /hoy|semana|mes/i }).first();
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Aserciones de datos ──────────────────────────────────────────────────

  async expectKpisLoaded() {
    // Esperar que al menos una KPI sea visible
    await expect(this.kpiCards.first()).toBeVisible({ timeout: 15_000 });
    // Verificar que no hay NaN o undefined en los KPIs
    const texts = await this.kpiCards.allTextContents();
    for (const text of texts) {
      expect(text).not.toContain('NaN');
      expect(text).not.toContain('undefined');
    }
  }

  async expectNoJsErrors() {
    // Registrar errores de consola antes de navegar
    const errors: string[] = [];
    this.page.on('pageerror', err => errors.push(err.message));
    await this.goto();
    expect(errors, `Errores JS en dashboard: ${errors.join(', ')}`).toHaveLength(0);
  }

  async expectLoadTimeUnder(ms: number) {
    const start = Date.now();
    await this.goto();
    const elapsed = Date.now() - start;
    expect(elapsed, `Dashboard tardó ${elapsed}ms (límite: ${ms}ms)`).toBeLessThan(ms);
  }

  // ─── Deferred props ───────────────────────────────────────────────────────

  async waitForAlertsLoaded() {
    // Las alertas se cargan como deferred props de Inertia
    await this.page.waitForResponse(
      r => r.url().includes('/dashboard') && r.status() === 200,
      { timeout: 15_000 },
    );
  }

  // ─── Widgets ──────────────────────────────────────────────────────────────

  async expectWidgetVisible(name: string | RegExp) {
    const widget = this.page.locator('section, [class*="widget"], [class*="card"]')
      .filter({ hasText: name })
      .first();
    await expect(widget).toBeVisible({ timeout: 15_000 });
  }
}
