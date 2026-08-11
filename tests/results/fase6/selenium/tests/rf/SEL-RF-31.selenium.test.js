import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-31: reintentar pago", withEvidence("SEL-RF-31", rfCases["RF-31"]));
