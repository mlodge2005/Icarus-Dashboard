/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as capabilities from "../capabilities.js";
import type * as content from "../content.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as lib_activity from "../lib/activity.js";
import type * as lib_response from "../lib/response.js";
import type * as lib_types from "../lib/types.js";
import type * as ops from "../ops.js";
import type * as projects from "../projects.js";
import type * as protocols from "../protocols.js";
import type * as system from "../system.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  capabilities: typeof capabilities;
  content: typeof content;
  documents: typeof documents;
  http: typeof http;
  "lib/activity": typeof lib_activity;
  "lib/response": typeof lib_response;
  "lib/types": typeof lib_types;
  ops: typeof ops;
  projects: typeof projects;
  protocols: typeof protocols;
  system: typeof system;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
