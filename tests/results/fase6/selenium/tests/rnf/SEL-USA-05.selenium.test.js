import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-USA-05: navegación por teclado", withEvidence("SEL-USA-05", rnfCases["USA-05"]));
