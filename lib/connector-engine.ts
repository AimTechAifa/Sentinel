/**
 * Server-only bridge to the connector-engine package.
 * Imports compiled JS from the sibling package — avoids Turbopack monorepo panics.
 */
export {
  decryptCredentials,
  encryptCredentials,
  runConnectorById,
  testConnectorConnection,
} from "../../connector-engine/dist/index.js";
