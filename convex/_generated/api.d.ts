/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as backFillOrder from "../backFillOrder.js";
import type * as cleanup from "../cleanup.js";
import type * as flashcards from "../flashcards.js";
import type * as graph from "../graph.js";
import type * as links from "../links.js";
import type * as migration from "../migration.js";
import type * as pages from "../pages.js";
import type * as search from "../search.js";
import type * as searchNode from "../searchNode.js";
import type * as tags from "../tags.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  backFillOrder: typeof backFillOrder;
  cleanup: typeof cleanup;
  flashcards: typeof flashcards;
  graph: typeof graph;
  links: typeof links;
  migration: typeof migration;
  pages: typeof pages;
  search: typeof search;
  searchNode: typeof searchNode;
  tags: typeof tags;
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
