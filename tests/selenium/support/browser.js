import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { Builder, Browser, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

export const baseUrl = (process.env.E2E_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
export const reportDir = process.env.E2E_REPORT_DIR || resolve("tests/reports/selenium/manual");
mkdirSync(reportDir, { recursive: true });

export const createDriver = async () => {
  const options = new chrome.Options();
  if (process.env.E2E_HEADLESS !== "false") options.addArguments("--headless=new");
  const profileDirectory = resolve(reportDir, `chrome-profile-${crypto.randomUUID()}`);
  mkdirSync(profileDirectory, { recursive: true });
  options.addArguments(
    "--window-size=1440,1000",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    `--user-data-dir=${profileDirectory}`,
  );

  const cachedDriver = resolve(
    homedir(),
    ".cache",
    "selenium",
    "chromedriver",
    "win64",
    "151.0.7922.77",
    "chromedriver.exe",
  );
  const driverPath = process.env.CHROMEDRIVER_PATH || (existsSync(cachedDriver) ? cachedDriver : null);
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
      try {
        rmSync(driver.testProfileDirectory, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 250,
        });
      } catch (cleanupError) {
        // En Windows Chrome puede conservar por unos instantes archivos de caché.
        // La limpieza pendiente no debe convertir un flujo válido en prueba fallida.
        console.warn(`No se pudo eliminar inmediatamente el perfil temporal: ${cleanupError.message}`);
      }
    }
  }
};

export { By, until };
