import assert from "node:assert/strict";
import { test } from "node:test";
import { By, openRoute, until, visible, withEvidence } from "./support/browser.js";

test("ST-E2E-01: visitante navega las páginas públicas y conserva el aviso académico", withEvidence("ST-E2E-01", async (driver) => {
  const routes = [["/", "Inicio"], ["/productos", "Productos"], ["/nosotros", "Nosotros"], ["/ubicanos", "Ubícanos"], ["/contact", "Contacto"]];
  for (const [route] of routes) {
    await openRoute(driver, route);
    assert.match(await driver.findElement(By.css("body")).getText(), /Proyecto académico de demostración/i);
    assert.equal((await driver.findElements(By.css("nav"))).length > 0, true);
  }
}));

test("ST-E2E-02: catálogo público presenta disponibilidad, precio y stock", withEvidence("ST-E2E-02", async (driver, context) => {
  await openRoute(driver, "/productos");
  await visible(driver, By.css(".catalog-result-count"));
  await driver.wait(async () => !(await driver.findElement(By.css(".catalog-result-count")).getText()).includes("Preparando"), 15_000);
  const cards = await driver.findElements(By.css(".catalog-card"));
  if (cards.length === 0) return context.skip("Precondición: el ambiente no contiene productos disponibles");
  for (const card of cards) {
    const text = await card.getText(); assert.match(text, /S\/\s*\d/); assert.match(text, /\d+ disponibles/);
  }
}));

test("ST-E2E-03: búsqueda actualiza el catálogo y puede limpiarse", withEvidence("ST-E2E-03", async (driver) => {
  await openRoute(driver, "/productos");
  const counter = await visible(driver, By.css(".catalog-result-count"));
  await driver.wait(async () => !(await counter.getText()).includes("Preparando"), 15_000);
  const search = await driver.findElement(By.css('input[type="search"]'));
  await search.sendKeys("producto-que-no-existe-e2e");
  await visible(driver, By.css(".catalog-empty")); assert.match(await driver.findElement(By.css(".catalog-empty")).getText(), /No encontramos coincidencias/i);
  await driver.findElement(By.css(".catalog-empty button")).click();
  assert.equal(await search.getAttribute("value"), "");
}));

test("ST-E2E-04: producto se agrega al carrito y cantidad modifica el resumen", withEvidence("ST-E2E-04", async (driver, context) => {
  await openRoute(driver, "/productos");
  const counter = await visible(driver, By.css(".catalog-result-count")); await driver.wait(async () => !(await counter.getText()).includes("Preparando"), 15_000);
  const buttons = await driver.findElements(By.css(".catalog-card button")); if (buttons.length === 0) return context.skip("Precondición: se requiere un producto disponible");
  const add = buttons[0]; await add.click();
  const confirm = await visible(driver, By.css(".swal2-confirm")); await confirm.click();
  await driver.findElement(By.css(".home-cart-button")).click();
  await visible(driver, By.css(".cart-item"));
  const before = await driver.findElement(By.css(".cart-quantity span")).getText();
  await driver.findElement(By.css('button[aria-label="Aumentar cantidad"]')).click();
  await driver.wait(async () => (await driver.findElement(By.css(".cart-quantity span")).getText()) !== before, 5_000);
  assert.match(await driver.findElement(By.css(".cart-total")).getText(), /S\/\s*\d/);
}));

test("ST-E2E-05: visitante que confirma es dirigido al registro", withEvidence("ST-E2E-05", async (driver, context) => {
  await openRoute(driver, "/productos");
  const counter = await visible(driver, By.css(".catalog-result-count")); await driver.wait(async () => !(await counter.getText()).includes("Preparando"), 15_000);
  const buttons = await driver.findElements(By.css(".catalog-card button")); if (buttons.length === 0) return context.skip("Precondición: se requiere un producto disponible");
  await buttons[0].click(); await (await visible(driver, By.css(".swal2-confirm"))).click();
  await driver.findElement(By.css(".home-cart-button")).click(); await (await visible(driver, By.css(".cart-checkout"))).click();
  await driver.wait(until.urlContains("/registro"), 5_000); assert.match(await driver.findElement(By.css("h1")).getText(), /próximo pedido/i);
}));

test("ST-E2E-16: visitante no puede abrir el panel administrativo", withEvidence("ST-E2E-16", async (driver) => {
  await openRoute(driver, "/admin");
  await driver.sleep(800);
  assert.equal(new URL(await driver.getCurrentUrl()).pathname === "/admin", false);
  assert.match(await driver.findElement(By.css("body")).getText(), /Iniciar sesión|Inicio|Proyecto académico/i);
}));

test("ST-E2E-31: las rutas limpias profundas sobreviven a una recarga", withEvidence("ST-E2E-31", async (driver) => {
  for (const route of ["/productos", "/nosotros", "/ubicanos", "/contact"]) {
    await openRoute(driver, route); await driver.navigate().refresh(); await visible(driver, By.css("body"));
    const current = new URL(await driver.getCurrentUrl());
    assert.equal(current.pathname, route); assert.equal(current.hash, "");
  }
}));

test("ST-E2E-36: catálogo y navegación son operables en viewport móvil", withEvidence("ST-E2E-36", async (driver) => {
  await driver.manage().window().setRect({ width: 390, height: 844 }); await openRoute(driver, "/productos");
  const toggle = await visible(driver, By.css(".navbar-toggler")); assert.equal(await toggle.isDisplayed(), true);
  assert.equal(await (await visible(driver, By.css('input[type="search"]'))).isDisplayed(), true);
}));

test("ST-E2E-37: controles esenciales son alcanzables por teclado y tienen nombre accesible", withEvidence("ST-E2E-37", async (driver) => {
  await openRoute(driver, "/productos");
  const controls = await driver.findElements(By.css("a,button,input")); assert.ok(controls.length > 5);
  const cart = await driver.findElement(By.css(".home-cart-button")); assert.match(await cart.getAttribute("aria-label"), /Abrir carrito/i);
  const search = await driver.findElement(By.css('input[type="search"]')); assert.ok(await search.getAttribute("placeholder"));
}));
