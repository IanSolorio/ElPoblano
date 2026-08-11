import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-USA-01: flujo completo con éxito del noventa por ciento", withEvidence("SEL-USA-01", rnfCases["USA-01"]));
