import { test } from "node:test";
import { withEvidence } from "../support/browser.js";
import { rnfCases } from "../support/rnfCases.js";

test("SEL-POR-03: build y rutas profundas", withEvidence("SEL-POR-03", rnfCases["POR-03"]));
