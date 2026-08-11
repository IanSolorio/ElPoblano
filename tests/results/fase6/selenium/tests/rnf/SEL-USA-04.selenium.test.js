import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-USA-04: viewports críticos", withEvidence("SEL-USA-04", rnfCases["USA-04"]));
