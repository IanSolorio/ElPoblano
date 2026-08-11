import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-16: activar y desactivar clientes", withEvidence("SEL-RF-16", rfCases["RF-16"]));
