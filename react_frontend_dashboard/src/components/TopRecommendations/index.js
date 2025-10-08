 // PUBLIC_INTERFACE
 /**
  * JS facade that re-exports the TS component.
  * Use this for JavaScript-only import sites to avoid direct .tsx path imports.
  * Exports both default and named to match TS barrel and avoid import mismatches.
  */
 export { default } from './TopRecommendations.tsx';
 export { default as TopRecommendations } from './TopRecommendations.tsx';
