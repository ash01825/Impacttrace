import { Router } from "express";
import { Scenario } from "../types";

export const scenariosRouter = Router();

const scenarios: Scenario[] = [
  {
    id: "scenario-1",
    name: "Auth Token Validator Signature Change",
    description:
      "Change the validateToken function signature in the auth service. Discovers the implicit behavioral contract with the payment validation service.",
    changedFile: "services/auth/tokenValidator.js",
    changedFunction: "validateToken",
    diffSnippet: `@@ -5,7 +5,7 @@
 function validateToken(tokenObj) {
-function validateToken(tokenString, userId) {
+  if (!tokenObj || typeof tokenObj !== "object") {
+    return { valid: false, reason: "Token must be an object" };
+  }
 
-  if (!tokenString || typeof tokenString !== "string") {
-    return { valid: false, reason: "Token must be a string" };
-  }
-
-  let tokenObj;
-  try {
-    tokenObj = JSON.parse(tokenString);
-  } catch {
-    return { valid: false, reason: "Token must be valid JSON" };
-  }
-
   if (!tokenObj.token || typeof tokenObj.token !== "string" || tokenObj.token.length < 32) {
     return { valid: false, reason: "Invalid token string" };
   }`,
  },
  {
    id: "scenario-2",
    name: "Database Schema Migration",
    description:
      "A database schema change in the shared config cascades through 4 services. Watches transitive dependencies propagate.",
    changedFile: "shared/config/db-schema.js",
    changedFunction: "getUserSchema",
    diffSnippet: `@@ -12,7 +12,8 @@
 const userSchema = {
   id: "string",
   name: "string",
-  email: "string",
+  email: "object",
+  email: { address: "string", verified: "boolean" },
   createdAt: "timestamp"
 };`,
  },
  {
    id: "scenario-3",
    name: "Low-Risk Config Update",
    description:
      "A safe configuration change with low overall risk. Demonstrates that ImpactTrace handles safe changes correctly without false alarms.",
    changedFile: "shared/config/app-config.json",
    changedFunction: "getAppConfig",
    diffSnippet: `@@ -3,7 +3,7 @@
 {
   "appName": "ImpactTrace Demo",
-  "logLevel": "info",
+  "logLevel": "debug",
   "maxRetries": 3,
   "timeout": 5000
 }`,
  },
];

scenariosRouter.get("/scenarios", (_req, res) => {
  res.json(scenarios);
});
