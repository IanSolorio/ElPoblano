import assert from "node:assert/strict";
import { By, Key, api, authenticate, bodyText, buttonByText, fixture, getPrisma, loginThroughUi, openRoute, until, visible, waitForBody } from "./browser.js";

const waitCatalog = async (driver) => {
  const counter = await visible(driver, By.css(".catalog-result-count"));
  await driver.wait(async () => !(await counter.getText()).includes("Preparando"), 15_000);
};
const clickCentered = async (driver, element) => {
  await driver.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" })', element);
  await driver.executeScript("arguments[0].click()", element);
};

export const rnfCases = {
  "SEG-02": async (driver) => {
    const checks = [
      [await api("/admin/usuarios", { role: null }), 401],
      [await api("/admin/usuarios", { role: "CUSTOMER" }), 403],
      [await api("/categorias/admin", { role: "ADMIN" }), 403],
      [await api("/categorias/admin", { role: "SUPER_ADMIN" }), 200],
      [await api("/pedidos/admin", { role: "ADMIN" }), 200],
    ];
    for (const [result, expected] of checks) assert.equal(result.status, expected);
    await authenticate(driver); await openRoute(driver, "/admin"); await driver.sleep(500);
    assert.notEqual(new URL(await driver.getCurrentUrl()).pathname, "/admin");
  },
  "SEG-03": async (_driver, context) => {
    const url = process.env.E2E_COOKIE_TEST_URL;
    const email = process.env.E2E_HTTPS_CUSTOMER_EMAIL;
    const password = process.env.E2E_HTTPS_CUSTOMER_PASSWORD;
    if (!url || !email || !password) return context.skip("REQUIERE_REVISION: necesita staging HTTPS y credenciales E2E dedicadas");
    const response = await fetch(`${url.replace(/\/$/, "")}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie") || "";
    assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=Lax/i); assert.match(cookie, /Path=\//i);
  },
  "SEG-04": async (driver) => {
    await loginThroughUi(driver, fixture.users.customer.email); await waitForBody(driver, /Hola,\s+Carlos/i);
    await driver.findElement(buttonByText("Salir")).click(); await waitForBody(driver, /Iniciar sesi/i);
    await openRoute(driver, "/mis-pedidos"); await driver.wait(until.urlContains("/productos"), 10_000);
  },
  "SEG-07": async (driver) => {
    await authenticate(driver, "ADMIN");
    const name = `Auditoría RNF ${Date.now()}`;
    const result = await api("/productos", { role: "ADMIN", method: "POST", body: { nombre: name, descripcion: "Control SEG-07", categoriaId: fixture.categories.category.id, precio: 7, stock: 2, activo: true } });
    assert.equal(result.status, 201);
    const prisma = await getPrisma();
    const logs = await prisma.auditLog.findMany({ where: { entityId: result.data.id, userId: fixture.users.admin.id } });
    assert.equal(logs.length, 1); assert.equal(logs[0].action, "PRODUCT_CREATED");
  },
  "SEG-08": async (driver, context) => {
    const target = process.env.E2E_HTTPS_BASE_URL;
    if (!target) return context.skip("REQUIERE_REVISION: necesita URL HTTPS desplegada");
    await driver.get(target);
    assert.equal(new URL(await driver.getCurrentUrl()).protocol, "https:");
    const insecure = await driver.executeScript("return performance.getEntriesByType('resource').map(e=>e.name).filter(u=>u.startsWith('http:'))");
    assert.deepEqual(insecure, []);
  },
  "REN-04": async (driver) => {
    const started = performance.now(); await openRoute(driver, "/productos"); await waitCatalog(driver);
    const elapsed = performance.now() - started; assert.ok(elapsed <= 3000, `Contenido útil tardó ${elapsed.toFixed(0)} ms`);
  },
  "USA-01": async (driver) => {
    let passed = 0;
    const failures = [];
    const runId = Date.now();
    for (let index = 0; index < 10; index += 1) {
      try {
        await driver.manage().deleteAllCookies();
        await openRoute(driver, "/registro");
        await driver.executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
        const values = { firstName: "Usabilidad", lastName: `Caso ${index}`, email: `usa01.${runId}.${index}@test.local`, phone: "999777666", password: fixture.password, addressLine: "Av. Usabilidad 123" };
        for (const [name, value] of Object.entries(values)) await driver.findElement(By.css(`[name="${name}"]`)).sendKeys(value);
        const map = await visible(driver, By.css(".leaflet-container"), 15_000);
        await driver.executeScript("arguments[0].scrollIntoView({ block: 'center' });", map);
        await driver.actions({ async: true }).move({ origin: map, x: 0, y: 0 }).click().perform();
        await visible(driver, By.css(".leaflet-marker-icon"), 5_000);
        await clickCentered(driver, await driver.findElement(By.css('button[type="submit"]')));
        await driver.wait(until.urlContains("/productos"), 15_000); await waitCatalog(driver);
        const first = await driver.findElement(By.css(".catalog-card button")); await clickCentered(driver, first); await (await visible(driver, By.css(".swal2-confirm"))).click();
        await clickCentered(driver, await driver.findElement(By.css(".home-cart-button"))); await visible(driver, By.css(".cart-item"));
        await clickCentered(driver, await driver.findElement(By.css(".cart-checkout")));
        await driver.wait(until.urlContains("/checkout"), 10_000);
        await visible(driver, By.id("checkout-notes"));
        passed += 1;
      } catch (error) {
        failures.push(`recorrido ${index + 1}: ${error.message}`);
      }
    }
    assert.ok(passed >= 9, `${passed}/10 recorridos completados. ${failures.slice(0, 3).join(" | ")}`);
  },
  "USA-02": async (driver) => {
    const started = performance.now(); await openRoute(driver, "/productos"); await waitCatalog(driver);
    await driver.findElement(By.css('input[type="search"]')).sendKeys("Taco Selenium");
    const card = await visible(driver, By.css(".catalog-card")); await card.findElement(By.css("button")).click(); await (await visible(driver, By.css(".swal2-confirm"))).click();
    await driver.findElement(By.css(".home-cart-button")).click(); await visible(driver, By.css(".cart-item"));
    assert.ok(performance.now() - started <= 60_000);
  },
  "USA-03": async (driver) => {
    const results = [];
    await openRoute(driver, "/registro");
    results.push(await driver.executeScript("return !document.querySelector('.registration-form').checkValidity()"));
    await openRoute(driver, "/"); await driver.findElement(By.css(".home-navbar__login")).click();
    await visible(driver, By.css('input[type="email"]')); await driver.findElement(By.css('input[type="email"]')).sendKeys("incorrecto@test.local"); await driver.findElement(By.css('input[type="password"]')).sendKeys("contraseña-incorrecta"); await driver.findElement(buttonByText("Ingresar")).click();
    await driver.wait(async () => /credenciales|correo|contraseña/i.test(await bodyText(driver)), 10_000); results.push(true);
    await authenticate(driver, "ADMIN"); await openRoute(driver, "/crearproducto");
    results.push(await driver.executeScript("return !document.querySelector('.admin-form-card').checkValidity()"));
    assert.deepEqual(results, [true, true, true]);
  },
  "USA-04": async (driver) => {
    const widths = [360, 768, 1366];
    for (const width of widths) {
      await driver.manage().window().setRect({ width, height: 900 });
      for (const route of ["/", "/productos", "/registro"]) {
        await openRoute(driver, route);
        const overflow = await driver.executeScript("return document.documentElement.scrollWidth - document.documentElement.clientWidth");
        assert.ok(overflow <= 2, `${route} desborda ${overflow}px a ${width}px`);
      }
    }
  },
  "USA-05": async (driver) => {
    await openRoute(driver, "/productos"); await waitCatalog(driver);
    const controls = await driver.findElements(By.css("a,button,input,select,textarea"));
    const visibleControls = [];
    for (const control of controls) {
      if (await control.isDisplayed()) visibleControls.push(control);
    }
    assert.ok(visibleControls.length > 8);
    for (const control of visibleControls) {
      const name = await control.getAccessibleName();
      const tag = await control.getTagName();
      const type = await control.getAttribute("type");
      assert.ok(name?.trim(), `Control ${tag}${type ? `[type=${type}]` : ""} sin nombre accesible`);
    }
    await driver.findElement(By.css("body")).sendKeys(Key.TAB);
    const focused = await driver.switchTo().activeElement(); assert.notEqual(await focused.getTagName(), "body");
  },
  "POR-03": async (driver) => {
    for (const route of ["/productos", "/nosotros", "/ubicanos", "/contact", "/registro"]) {
      await openRoute(driver, route); await driver.navigate().refresh(); await visible(driver, By.css("body"));
      const current = new URL(await driver.getCurrentUrl()); assert.equal(current.pathname, route); assert.equal(current.hash, "");
      assert.doesNotMatch(await bodyText(driver), /404|Not Found/i);
    }
  },
};
