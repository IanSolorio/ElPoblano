import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-28: estadísticas mensuales", withEvidence("SEL-RF-28", rfCases["RF-28"]));
