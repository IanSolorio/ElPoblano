import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-20: bloquear preparación sin pago", withEvidence("SEL-RF-20", rfCases["RF-20"]));
