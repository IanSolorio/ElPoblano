import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-USA-03: validaciones identificables", withEvidence("SEL-USA-03", rnfCases["USA-03"]));
