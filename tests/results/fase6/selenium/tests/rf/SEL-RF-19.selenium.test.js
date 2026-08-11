import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-19: buscar y filtrar pedidos", withEvidence("SEL-RF-19", rfCases["RF-19"]));
