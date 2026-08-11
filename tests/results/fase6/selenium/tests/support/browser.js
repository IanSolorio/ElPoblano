import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export const baseUrl = (process.env.E2E_BASE_URL || "http://localhost:5174").replace(/\/$/, "");
export const apiUrl = (process.env.E2E_API_URL || "http://localhost:3001/api").replace(/\/$/, "");
export const reportDir = process.env.E2E_REPORT_DIR || resolve("tests/results/fase6/selenium/reports/manual");
const fixturePath = resolve("tests/results/fase6/selenium/tests/data/fixtures.json");
if (process.env.E2E_RESET_PER_CASE === "true") {
  const preparation = spawnSync(process.execPath, [resolve("scripts/prepareSeleniumData.js")], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
  });
  if (preparation.status !== 0) {
    throw new Error(`No se pudo aislar el caso Selenium. ${preparation.stderr || preparation.stdout || ""}`);
  }
}
export const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
mkdirSync(reportDir, { recursive: true });

const cachedChromeDriver = () => {
  const userRoot = process.env.USERPROFILE || process.env.HOME;
  if (!userRoot) return undefined;
  const cacheRoot = resolve(userRoot, ".cache/selenium/chromedriver/win64");
  if (!existsSync(cacheRoot)) return undefined;
  const versions = readdirSync(cacheRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
  return versions.map((version) => resolve(cacheRoot, version, "chromedriver.exe")).find(existsSync);
};

export const createDriver = async () => {
  const options = new chrome.Options();
  if (process.env.E2E_HEADLESS !== "false") options.addArguments("--headless=new");
  const profileDirectory = resolve(tmpdir(), `elpoblano-chrome-${crypto.randomUUID()}`);
  mkdirSync(profileDirectory, { recursive: true });
  options.addArguments("--window-size=1440,1000", "--disable-dev-shm-usage", "--no-sandbox", `--user-data-dir=${profileDirectory}`);
  // Selenium Manager resuelve una versión compatible con el Chrome presente.
  // Solo se fuerza un binario cuando el ejecutor lo declara explícitamente.
  const driverPath = process.env.CHROMEDRIVER_PATH || cachedChromeDriver();
  const builder = new Builder().forBrowser(Browser.CHROME).setChromeOptions(options);
  if (driverPath) builder.setChromeService(new chrome.ServiceBuilder(driverPath));
  const driver = await builder.build();
  driver.testProfileDirectory = profileDirectory;
  return driver;
};

export const openRoute = async (driver, route = "/") => {
  await driver.get(`${baseUrl}${route}`);
  await driver.wait(until.elementLocated(By.css("body")), 10_000);
};
export const visible = async (driver, locator, timeout = 10_000) => {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
};
export const bodyText = async (driver) => driver.findElement(By.css("body")).getText();
export const waitForBody = async (driver, pattern, timeout = 10_000) => driver.wait(async () => pattern.test(await bodyText(driver)), timeout);
export const buttonByText = (text) => By.xpath(`//button[contains(normalize-space(.), "${text}")]`);
export const linkByText = (text) => By.xpath(`//a[contains(normalize-space(.), "${text}")]`);

export const authenticate = async (driver, role = "CUSTOMER") => {
  await openRoute(driver, "/");
  await driver.manage().deleteAllCookies();
  await driver.manage().addCookie({ name: "elpoblano_session", value: fixture.sessions[role], path: "/", httpOnly: true });
  await driver.navigate().refresh();
  await driver.wait(async () => (await bodyText(driver)).includes("Salir"), 10_000);
};

export const loginThroughUi = async (driver, email, password = fixture.password) => {
  await openRoute(driver, "/");
  await visible(driver, By.css(".home-navbar__login"));
  await driver.findElement(By.css(".home-navbar__login")).click();
  const emailInput = await visible(driver, By.css('input[type="email"]'));
  await emailInput.sendKeys(email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(password);
  await driver.findElement(buttonByText("Ingresar")).click();
};

export const api = async (path, { role = "CUSTOMER", method = "GET", body, headers = {} } = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(role ? { Cookie: `elpoblano_session=${fixture.sessions[role]}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, status: response.status, data };
};

export const clearAndType = async (element, value) => {
  await element.sendKeys(Key.chord(Key.CONTROL, "a"), String(value));
};

let prismaPromise;
export const getPrisma = async () => {
  prismaPromise ||= import(pathToFileURL(resolve("apps/backend/src/shared/database/prisma.js")).href).then(({ prisma }) => prisma);
  return prismaPromise;
};

export const withEvidence = (id, action) => async (context) => {
  const driver = await createDriver();
  try {
    await action(driver, context);
  } catch (error) {
    const image = await driver.takeScreenshot().catch(() => null);
    if (image) writeFileSync(resolve(reportDir, `${id}-fallo.png`), image, "base64");
    const logs = await driver.manage().logs().get("browser").catch(() => []);
    writeFileSync(resolve(reportDir, `${id}-consola.json`), JSON.stringify(logs, null, 2), "utf8");
    throw error;
  } finally {
    await driver.quit();
    if (driver.testProfileDirectory) {
      try { rmSync(driver.testProfileDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }); }
      catch (error) { console.warn(`Perfil temporal pendiente de limpieza: ${error.message}`); }
    }
    if (prismaPromise) {
      const prisma = await prismaPromise;
      await prisma.$disconnect();
      prismaPromise = undefined;
    }
  }
};

export { By, Key, until };
