# ImpactTrace Demonstration Repository

A curated Node.js monorepo demonstrating realistic service interconnections with deliberately engineered implicit dependencies.

## Architecture

This monorepo contains 4 services that form a typical enterprise microservice landscape:

```
demo-repo/
├── services/
│   ├── auth/        # Authentication service — token generation and validation
│   ├── orders/      # Order processing — creates and manages customer orders
│   ├── payment/     # Payment validation — validates tokens and processes payments
│   └── users/       # User management — user profiles and preferences
└── shared/
    └── config/      # Shared configuration schemas consumed across services
```

## Implicit Dependencies

### Critical: auth ↔ payment (behavioral contract)

The `payment` service does **not** import anything from `auth`. It has no `require("../auth/...")` or `import ... from "../auth"`. However, both services consume `shared/config/token-schema.json`, which defines the runtime token format. The `auth` service's `tokenValidator.js` function produces tokens according to this schema. The `payment` service's `validateCheckoutToken.js` function consumes tokens according to this same schema. A change to the token validation function signature or the schema itself breaks the payment service — but no static import analysis will catch this dependency.

This is the implicit behavioral contract that `watsonx.ai Granite` discovers: a shared schema creates a runtime contract between services that are otherwise completely disconnected in the import graph.

## Service Descriptions

### Auth Service (`services/auth/`)
- `tokenValidator.js` — Validates authentication tokens against the shared token schema
- `authMiddleware.js` — Express middleware that calls tokenValidator for route protection
- `sessionManager.js` — Manages user sessions, calls tokenValidator on session restore

### Orders Service (`services/orders/`)
- `orderService.js` — Core order creation and management, calls authMiddleware
- `orderController.js` — HTTP handlers for order endpoints, depends on orderService
- `checkoutService.js` — Checkout workflow, calls orderService and triggers payment validation

### Payment Service (`services/payment/`)
- `validateCheckoutToken.js` — Validates checkout tokens using the shared token schema
- `paymentProcessor.js` — Processes payments, calls validateCheckoutToken before charging
- `refundHandler.js` — Handles refunds, also calls validateCheckoutToken for verification

### Users Service (`services/users/`)
- `userController.js` — User profile management, calls authMiddleware
- `profileService.js` — User profile logic, depends on sessionManager
- `preferencesService.js` — User preferences, no dependency on auth but consumes shared config

## Key Implicit Connection

The blast radius demo centers on a change to `services/auth/tokenValidator.js` signature. This change:
1. Directly affects `authMiddleware.js` and `sessionManager.js` (direct callers)
2. Transitively affects `orderService.js` and `userController.js` (call callers)
3. Implicitly affects `payment/validateCheckoutToken.js` via the shared `token-schema.json` (behavioral contract)

No dependency graph tool would connect #3 to #1. watsonx.ai Granite discovers it.
