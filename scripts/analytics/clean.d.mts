// Types for ./clean.mjs, used by its unit tests.
type Filter = { filter: { fieldName: string; inListFilter: { values: string[] } } } | { andGroup: { expressions: unknown[] } };
export const SITE_HOSTS: string[];
export const onSiteOnly: { filter: { fieldName: string; inListFilter: { values: string[] } } };
export function withSiteFilter(filter?: unknown): Filter;
export function count(value: unknown): number;
export function amount(value: unknown, digits?: number): number;
export function text(value: unknown, max?: number): string;
export function countryCode(value: unknown): string | null;
export function pagePath(value: unknown): string | null;
