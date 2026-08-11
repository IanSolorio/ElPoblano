import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-30: carrusel promocional", withEvidence("SEL-RF-30", rfCases["RF-30"]));
