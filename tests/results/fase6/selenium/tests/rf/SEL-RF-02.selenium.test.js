import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rfCases } from "../support/rfCases.js";

test("SEL-RF-02: carrito de productos y promociones", withEvidence("SEL-RF-02", rfCases["RF-02"]));
