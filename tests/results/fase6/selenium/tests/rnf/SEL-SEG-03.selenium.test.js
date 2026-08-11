import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-SEG-03: atributos seguros de cookie", withEvidence("SEL-SEG-03", rnfCases["SEG-03"]));
