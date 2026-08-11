import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-15: consultar y actualizar clientes", withEvidence("SEL-RF-15", rfCases["RF-15"]));
