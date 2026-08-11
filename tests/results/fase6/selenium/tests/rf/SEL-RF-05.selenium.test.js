import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-05: autenticación obligatoria", withEvidence("SEL-RF-05", rfCases["RF-05"]));
