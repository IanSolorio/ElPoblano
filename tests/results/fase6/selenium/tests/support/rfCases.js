import assert from "node:assert/strict";
import { By, Key, api, authenticate, bodyText, buttonByText, clearAndType, fixture, getPrisma, linkByText, loginThroughUi, openRoute, until, visible, waitForBody } from "./browser.js";

const waitCatalog = async (driver) => {
  const counter = await visible(driver, By.css(".catalog-result-count"));
  await driver.wait(async () => !(await counter.getText()).includes("Preparando"), 15_000);
};
const addFirstProduct = async (driver) => {
  await openRoute(driver, "/productos");
  await waitCatalog(driver);
  const button = await visible(driver, By.css(".catalog-card button"));
  await button.click();
  await (await visible(driver, By.css(".swal2-confirm"))).click();
};
const openAdmin = async (driver, route = "/admin", role = "ADMIN") => {
  await authenticate(driver, role);
  await openRoute(driver, route);
  await visible(driver, By.css(".admin-sidebar"));
};
const findRow = async (driver, text) => visible(driver, By.xpath(`//tr[contains(., "${text}")]`), 15_000);
const setDateTimeLocal = async (driver, element, value) => {
  await driver.executeScript(`
    const input = arguments[0];
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, arguments[1]);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  `, element, value);
};
const formatLocalDateTime = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  .toISOString()
  .slice(0, 16);
const clickCentered = async (driver, element) => {
  await driver.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" })', element);
  await driver.executeScript("arguments[0].click()", element);
};
const clickSweetAlert = async (driver, expectedTitle) => {
  await driver.wait(async () => {
    const title = await driver.findElements(By.css(".swal2-title"));
    return title.length > 0 && expectedTitle.test(await title[0].getText());
  }, 15_000);
  await driver.executeScript(`
    const button = document.querySelector(".swal2-confirm");
    if (!button) throw new Error("No se encontrÃ³ el botÃ³n de confirmaciÃ³n de SweetAlert.");
    button.click();
  `);
};
const createPendingOrder = async (suffix = crypto.randomUUID()) => api("/pedidos", {
  method: "POST",
  headers: { "Idempotency-Key": `selenium-${suffix}` },
  body: { items: [{ productId: fixture.products.product.id, quantity: 1 }], paymentMethod: "CREDIT_CARD", addressId: fixture.address.id, notes: `SEL ${suffix}` },
});

export const rfCases = {
  "RF-01": async (driver) => {
    await openRoute(driver, "/productos"); await waitCatalog(driver);
    const text = await bodyText(driver);
    assert.match(text, /Taco Selenium/); assert.match(text, /S\/\s*\d/); assert.match(text, /\d+ disponibles/);
    assert.doesNotMatch(text, /Producto agotado E2E|Producto retirado E2E/);
  },
  "RF-02": async (driver) => {
    await addFirstProduct(driver);
    await openRoute(driver, "/");
    await visible(driver, By.css(".home-promo-card"), 15_000);
    const promo = await driver.findElement(By.css(".home-promo-card button"));
    await driver.executeScript("arguments[0].click()", promo);
    await (await visible(driver, By.css(".swal2-confirm"))).click();
    await driver.findElement(By.css(".home-cart-button")).click();
    assert.ok((await driver.findElements(By.css(".cart-item"))).length >= 2);
    const total = await driver.findElement(By.css(".cart-total"));
    const totalText = await driver.executeScript("return arguments[0].textContent", total);
    assert.match(totalText, /S\/\s*\d/);
  },
  "RF-03": async (driver) => {
    await openRoute(driver, "/registro");
    const email = `selenium.${Date.now()}@test.local`;
    const values = { firstName: "Registro", lastName: "Selenium", email, phone: "999888777", password: fixture.password, addressLine: "Av. Registro 123", reference: "E2E" };
    for (const [name, value] of Object.entries(values)) await driver.findElement(By.css(`[name="${name}"]`)).sendKeys(value);
    const map = await visible(driver, By.css(".leaflet-container"), 15_000);
    await driver.executeScript(`
      const element = arguments[0];
      element.scrollIntoView({ block: "center" });
      const bounds = element.getBoundingClientRect();
      element.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        clientX: bounds.left + bounds.width / 2,
        clientY: bounds.top + bounds.height / 2,
        view: window,
      }));
    `, map);
    await visible(driver, By.css(".leaflet-marker-icon"), 5_000);
    const submit = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].click()", submit);
    await driver.wait(until.urlContains("/productos"), 15_000);
    const prisma = await getPrisma();
    const created = await prisma.user.findUnique({ where: { email }, include: { addresses: true } });
    assert.equal(created?.addresses.length, 1);
  },
  "RF-04": async (driver) => {
    await loginThroughUi(driver, fixture.users.customer.email);
    await waitForBody(driver, /Hola,\s+Carlos/i);
    await driver.findElement(buttonByText("Salir")).click();
    await waitForBody(driver, /Iniciar sesión/i);
    await openRoute(driver, "/mis-pedidos");
    await driver.wait(until.urlContains("/productos"), 10_000);
  },
  "RF-05": async (driver) => {
    await openRoute(driver, "/checkout");
    await driver.wait(until.urlContains("/registro"), 10_000);
    assert.match(await bodyText(driver), /Empieza tu próximo pedido/i);
  },
  "RF-06": async (driver) => {
    await authenticate(driver); await addFirstProduct(driver);
    await driver.findElement(By.css(".home-cart-button")).click();
    await (await visible(driver, By.css(".cart-checkout"))).click();
    await visible(driver, By.id("checkout-notes"));
    await driver.findElement(By.id("checkout-notes")).sendKeys("Pedido RF-06");
    await driver.findElement(buttonByText("Continuar al pago")).click();
    await visible(driver, By.css(".e2e-payment-stub"), 15_000);
    const prisma = await getPrisma();
    const orders = await prisma.order.findMany({ where: { userId: fixture.users.customer.id, notes: "Pedido RF-06" }, include: { items: true } });
    assert.equal(orders.length, 1); assert.equal(orders[0].items.length, 1);
  },
  "RF-07": async (driver) => {
    await authenticate(driver); await openRoute(driver, "/mis-pedidos");
    const pay = await visible(driver, By.css(".current-order-pay"), 15_000); await clickCentered(driver, pay);
    const approve = await visible(driver, buttonByText("Aprobar pago de prueba")); await clickCentered(driver, approve);
    await driver.wait(async () => !(await bodyText(driver)).includes("Proveedor de pago simulado activo"), 15_000);
    const prisma = await getPrisma();
    assert.ok(await prisma.payment.count({ where: { status: "APPROVED", provider: "MERCADO_PAGO" } }) >= 1);
    const rejectedOrder = await createPendingOrder("rf07-rejected");
    assert.equal(rejectedOrder.status, 201);
    const rejectedPayment = await api("/pagos/mercadopago", {
      method: "POST",
      headers: { "Idempotency-Key": `selenium-rf07-${crypto.randomUUID()}` },
      body: {
        orderId: rejectedOrder.data.id,
        paymentData: { token: "e2e-rejected", payment_method_id: "master", installments: 1 },
      },
    });
    assert.equal(rejectedPayment.status, 200);
    assert.equal(rejectedPayment.data.status, "CANCELLED");
    assert.equal(rejectedPayment.data.payment.status, "REJECTED");
  },
  "RF-08": async (driver) => {
    await authenticate(driver); await openRoute(driver, "/historial");
    await visible(driver, By.css(".monthly-history__card"), 15_000);
    assert.match(await bodyText(driver), /compra entregada|compras entregadas/i);
  },
  "RF-09": async (driver) => {
    await openRoute(driver, "/admin"); await driver.wait(async () => new URL(await driver.getCurrentUrl()).pathname !== "/admin", 10_000);
    await authenticate(driver); await openRoute(driver, "/admin"); await driver.wait(async () => new URL(await driver.getCurrentUrl()).pathname !== "/admin", 10_000);
    await openAdmin(driver, "/admin", "ADMIN");
    await openRoute(driver, "/admin/categorias"); await driver.wait(async () => new URL(await driver.getCurrentUrl()).pathname !== "/admin/categorias", 10_000);
    await openAdmin(driver, "/admin/categorias", "SUPER_ADMIN");
  },
  "RF-10": async (driver) => {
    await openAdmin(driver, "/crearproducto");
    const name = `Producto creado Selenium ${Date.now()}`;
    await driver.findElement(By.css('[name="nombre"]')).sendKeys(name);
    await driver.findElement(By.css('[name="descripcion"]')).sendKeys("Creado mediante Selenium");
    await driver.findElement(By.css('[name="categoriaId"]')).sendKeys("Tacos E2E");
    await driver.findElement(By.css('[name="precio"]')).sendKeys("14.50");
    await clearAndType(await driver.findElement(By.css('[name="stock"]')), 15);
    await clickCentered(driver, await driver.findElement(By.css('button[type="submit"]')));
    await (await visible(driver, By.css(".swal2-confirm"), 15_000)).click();
    await waitForBody(driver, new RegExp(name));
  },
  "RF-11": async (driver) => {
    await openAdmin(driver, `/editarproducto/${fixture.products.product.id}`);
    const price = await visible(driver, By.css('[name="precio"]')); await clearAndType(price, "11.50");
    const stock = await driver.findElement(By.css('[name="stock"]')); await clearAndType(stock, 321);
    await clickCentered(driver, await driver.findElement(By.css('button[type="submit"]')));
    await (await visible(driver, By.css(".swal2-confirm"), 15_000)).click();
    const { data } = await api(`/productos/${fixture.products.product.id}`, { role: null });
    assert.equal(Number(data.precio), 11.5); assert.equal(data.stock, 321);
  },
  "RF-12": async (driver) => {
    const created = await api("/productos", { role: "ADMIN", method: "POST", body: { nombre: `Retirable ${Date.now()}`, descripcion: "Temporal", categoriaId: fixture.categories.category.id, precio: 5, stock: 3, activo: true } });
    assert.equal(created.status, 201);
    await openAdmin(driver, "/admin");
    const search = await visible(driver, By.css('.admin-search input')); await search.sendKeys(created.data.nombre);
    await driver.findElement(By.css(`[aria-label="Retirar ${created.data.nombre}"]`)).click();
    await clickSweetAlert(driver, /Retirar este producto/i);
    await clickSweetAlert(driver, /Producto retirado/i);
    const publicList = await api("/productos", { role: null });
    assert.equal(publicList.data.some(({ id }) => id === created.data.id), false);
  },
  "RF-13": async (driver) => {
    await openAdmin(driver, "/admin/promociones");
    const name = `Promoción Selenium ${Date.now()}`;
    await driver.findElement(By.css('.admin-promotion-form input[placeholder^="Ej."]')).sendKeys(name);
    const dates = await driver.findElements(By.css('.admin-promotion-form input[type="datetime-local"]'));
    const start = formatLocalDateTime(new Date(Date.now() - 60_000));
    const end = formatLocalDateTime(new Date(Date.now() + 86_400_000));
    await setDateTimeLocal(driver, dates[0], start); await setDateTimeLocal(driver, dates[1], end);
    const product = await driver.findElement(By.xpath('//div[contains(@class, "admin-promotion-products")]//label[contains(., "Taco Selenium")]//input[@type="checkbox"]'));
    await product.click();
    await clickCentered(driver, await driver.findElement(By.css('.admin-promotion-form button[type="submit"]')));
    await visible(driver, By.xpath(`//div[contains(@class, "admin-promotion-list")]//article[contains(., "${name}")]`), 15_000);
    const active = await api("/promociones", { role: null });
    assert.equal(active.status, 200);
    assert.ok(active.data.some((promotion) => promotion.name === name));
  },
  "RF-14": async (driver) => {
    await openRoute(driver, "/"); await visible(driver, By.css(".home-promo-card"), 15_000);
    const text = await bodyText(driver);
    assert.match(text, /Promo Selenium vigente|Combo Selenium/);
    assert.doesNotMatch(text, /Promo Selenium vencida|Promo Selenium futura/);
  },
  "RF-15": async (driver) => {
    const updated = await api(`/admin/usuarios/${fixture.users.customer.id}`, { role: "ADMIN", method: "PUT", body: { firstName: "Cliente", lastName: "Actualizado", phone: "988777666" } });
    assert.equal(updated.status, 200);
    await openAdmin(driver, "/admin/usuarios");
    await waitForBody(driver, /Cliente Actualizado/);
  },
  "RF-16": async (driver) => {
    const activated = await api(`/admin/usuarios/${fixture.users.inactiveCustomer.id}/status`, { role: "ADMIN", method: "PATCH", body: { active: true } });
    assert.equal(activated.status, 200);
    await openAdmin(driver, "/admin/usuarios");
    const row = await findRow(driver, fixture.users.inactiveCustomer.email);
    assert.match(await row.getText(), /Activo/);
    const login = await api("/auth/login", { role: null, method: "POST", body: { email: fixture.users.inactiveCustomer.email, password: fixture.password } });
    assert.equal(login.status, 200);
    const sessionCookie = (login.response.headers.get("set-cookie") || "").split(";")[0];
    assert.match(sessionCookie, /^elpoblano_session=/);
    await clickCentered(driver, await row.findElement(By.xpath('.//button[contains(normalize-space(.), "Desactivar")]')));
    await driver.wait(async () => {
      const currentRows = await driver.findElements(By.xpath(`//tr[contains(., "${fixture.users.inactiveCustomer.email}")]`));
      return currentRows.length === 1 && /Inactivo/.test(await currentRows[0].getText());
    }, 15_000);
    const denied = await api("/pedidos/actuales", { role: null, headers: { Cookie: sessionCookie } });
    assert.equal(denied.status, 401);
    const reactivated = await api(`/admin/usuarios/${fixture.users.inactiveCustomer.id}/status`, { role: "ADMIN", method: "PATCH", body: { active: true } });
    assert.equal(reactivated.data.active, true);
  },
  "RF-17": async (driver) => {
    await openAdmin(driver, "/admin/usuarios", "SUPER_ADMIN");
    const email = `admin.selenium.${Date.now()}@test.local`;
    const form = await visible(driver, By.css(".admin-form-card--horizontal"));
    const values = ["Nuevo", "Administrador", email, fixture.password];
    const inputs = await form.findElements(By.css("input"));
    for (let index = 0; index < inputs.length; index += 1) await inputs[index].sendKeys(values[index]);
    await form.findElement(By.css('button[type="submit"]')).click(); await waitForBody(driver, new RegExp(email));
    const list = await api("/admin/usuarios?limit=50", { role: "SUPER_ADMIN" });
    const account = list.data.data.find((item) => item.email === email); assert.ok(account);
    const forbidden = await api("/admin/usuarios/administradores", { role: "ADMIN", method: "POST", body: { firstName: "Sin", lastName: "Permiso", email: `forbidden.${Date.now()}@test.local`, password: fixture.password } });
    assert.equal(forbidden.status, 403);
    assert.equal((await api(`/admin/usuarios/${account.id}`, { role: "SUPER_ADMIN", method: "PUT", body: { firstName: "Admin", lastName: "Editado" } })).status, 200);
    assert.equal((await api(`/admin/usuarios/${account.id}`, { role: "SUPER_ADMIN", method: "DELETE" })).status, 200);
  },
  "RF-18": async (driver) => {
    await openAdmin(driver, "/crearproducto");
    const name = `Auditado ${Date.now()}`;
    const result = await api("/productos", { role: "ADMIN", method: "POST", body: { nombre: name, descripcion: "Auditoría", categoriaId: fixture.categories.category.id, precio: 6, stock: 1, activo: true } });
    assert.equal(result.status, 201);
    const prisma = await getPrisma();
    assert.equal(await prisma.auditLog.count({ where: { action: "PRODUCT_CREATED", entityId: result.data.id, userId: fixture.users.admin.id } }), 1);
  },
  "RF-19": async (driver) => {
    await openAdmin(driver, "/admin/pedidos");
    const input = await visible(driver, By.css(".order-search input")); await input.sendKeys("Carlos"); await driver.findElement(By.css(".order-search button")).click();
    await visible(driver, By.css(".order-table"));
    await driver.wait(async () => {
      try {
        const rows = await driver.findElements(By.css(".order-table tbody tr"));
        if (rows.length === 0) return false;
        return (await Promise.all(rows.map((row) => row.getText()))).every((text) => /Carlos/.test(text));
      } catch { return false; }
    }, 15_000);
    await clickCentered(driver, await driver.findElement(By.xpath('//button[contains(., "Por preparar")]')));
    await driver.wait(async () => {
      try {
        const statuses = await driver.findElements(By.css(".order-table .order-status"));
        return statuses.length > 0 && (await Promise.all(statuses.map((item) => item.getText()))).every((text) => text.includes("Confirmado"));
      } catch { return false; }
    }, 15_000);
  },
  "RF-20": async (driver) => {
    const result = await api(`/pedidos/admin/${fixture.orders.pending.id}/status`, { role: "ADMIN", method: "PATCH", body: { status: "PREPARING" } });
    assert.equal(result.status, 409); assert.equal(result.data.code, "INVALID_ORDER_STATUS_TRANSITION");
  },
  "RF-21": async (driver) => {
    const result = await api(`/pedidos/admin/${fixture.orders.confirmed.id}/status`, { role: "ADMIN", method: "PATCH", body: { status: "PREPARING" } });
    assert.equal(result.status, 200); assert.equal(result.data.status, "PREPARING");
  },
  "RF-22": async (driver) => {
    const result = await api(`/pedidos/admin/${fixture.orders.preparing.id}/status`, { role: "ADMIN", method: "PATCH", body: { status: "READY" } });
    assert.equal(result.status, 200); assert.equal(result.data.status, "READY");
  },
  "RF-23": async (driver) => {
    await openAdmin(driver, "/admin/pedidos");
    const row = await findRow(driver, fixture.orders.delivery.id.slice(0, 8).toUpperCase()); await row.findElement(buttonByText("Ver")).click();
    const detail = await visible(driver, By.css(".order-detail"));
    const text = await detail.getText(); assert.match(text, /Cliente y entrega/); assert.match(text, /Productos/); assert.match(text, /Av\. Automatización 123/);
  },
  "RF-24": async () => {
    const changed = await api(`/pedidos/admin/${fixture.orders.confirmed.id}/status`, { role: "ADMIN", method: "PATCH", body: { status: "PREPARING" } });
    assert.equal(changed.status, 200);
    const prisma = await getPrisma();
    const audit = await prisma.auditLog.findFirst({ where: { action: "ORDER_STATUS_UPDATED", entityId: fixture.orders.confirmed.id, userId: fixture.users.admin.id } });
    assert.equal(audit?.metadata?.newStatus, "PREPARING");
  },
  "RF-25": async (driver) => {
    await authenticate(driver); await openRoute(driver, "/mis-pedidos");
    await visible(driver, By.css(".current-order-card"), 15_000);
    assert.ok((await driver.findElements(By.css('[aria-current="step"]'))).length >= 1);
  },
  "RF-26": async (driver) => {
    await authenticate(driver); await openRoute(driver, "/historial");
    const card = await visible(driver, By.css(".monthly-history__card"), 15_000);
    assert.match(await card.getText(), /S\/\s*9\.00/); assert.ok((await card.findElements(By.css("details"))).length >= 1);
  },
  "RF-27": async () => {
    const first = await api(`/pedidos/admin/${fixture.orders.ready.id}/status`, { role: "ADMIN", method: "PATCH", body: { status: "OUT_FOR_DELIVERY" } });
    assert.equal(first.data.status, "OUT_FOR_DELIVERY");
    const second = await api(`/pedidos/admin/${fixture.orders.ready.id}/status`, { role: "ADMIN", method: "PATCH", body: { status: "DELIVERED" } });
    assert.equal(second.data.status, "DELIVERED");
  },
  "RF-28": async (driver) => {
    await openAdmin(driver, "/admin/estadisticas");
    await visible(driver, By.css(".analytics-summary"), 15_000);
    const text = await driver.findElement(By.css(".analytics-summary")).getText();
    for (const label of ["Ingresos", "Pedidos pagados", "Productos vendidos", "Clientes únicos", "Ticket promedio"]) assert.match(text, new RegExp(label));
  },
  "RF-29": async (driver) => {
    await openAdmin(driver, "/admin/estadisticas");
    const rankings = await driver.wait(async () => { const found = await driver.findElements(By.css(".analytics-ranking")); return found.length === 2 ? found : false; }, 15_000);
    assert.match(await rankings[0].getText(), /Taco Selenium/); assert.match(await rankings[1].getText(), /Promo Selenium vigente/);
  },
  "RF-30": async (driver) => {
    await openRoute(driver, "/"); const track = await visible(driver, By.css(".home-promotions__track"), 15_000);
    const before = await driver.executeScript("return arguments[0].scrollLeft", track); await driver.sleep(800);
    const after = await driver.executeScript("return arguments[0].scrollLeft", track); assert.notEqual(after, before);
    await driver.actions({ bridge: true }).move({ origin: track, x: 100, y: 30 }).press().move({ origin: track, x: -100, y: 30, duration: 300 }).release().perform();
  },
  "RF-31": async (driver) => {
    await authenticate(driver); await openRoute(driver, "/mis-pedidos");
    const pay = await visible(driver, By.css(".current-order-pay"), 15_000);
    const card = await pay.findElement(By.xpath("ancestor::article")); const idText = await card.findElement(By.css("header span")).getText();
    await clickCentered(driver, pay);
    await clickCentered(driver, await visible(driver, buttonByText("Aprobar pago de prueba")));
    const id = idText.replace(/.*#/, "").trim().toLowerCase();
    const prisma = await getPrisma();
    let order;
    await driver.wait(async () => {
      order = await prisma.order.findFirst({ where: { id: { startsWith: id } }, include: { payment: true } });
      return order?.status === "CONFIRMED" && order?.payment?.status === "APPROVED";
    }, 15_000);
    assert.equal(order?.status, "CONFIRMED"); assert.equal(order?.payment?.status, "APPROVED");
  },
  "RF-32": async (driver) => {
    const created = await createPendingOrder("rf32"); assert.equal(created.status, 201);
    const prisma = await getPrisma(); const before = await prisma.product.findUnique({ where: { id: fixture.products.product.id } });
    await authenticate(driver); await openRoute(driver, "/mis-pedidos");
    const row = await visible(driver, By.xpath(`//article[contains(., "${created.data.id.slice(0, 8).toUpperCase()}")]`), 15_000);
    await row.findElement(By.css(".current-order-cancel")).click(); await driver.switchTo().alert().accept();
    await driver.wait(async () => !(await bodyText(driver)).includes(created.data.id.slice(0, 8).toUpperCase()), 15_000);
    const cancelled = await prisma.order.findUnique({ where: { id: created.data.id } }); const after = await prisma.product.findUnique({ where: { id: fixture.products.product.id } });
    assert.equal(cancelled.status, "CANCELLED"); assert.equal(after.stock, before.stock + 1);
  },
};
