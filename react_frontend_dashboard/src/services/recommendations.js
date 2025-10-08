/**
 * PUBLIC_INTERFACE
 * JS facade for recommendations service (named exports only).
 * Avoid default export to prevent circular default<->named re-export loops.
 */
export {
  getRecommendations,
  // Backward compatibility alias
  selectTopHighPriorityRecommendations as selectTopHighRiskRecommendations,
  selectTopHighPriorityRecommendations,
  formatCurrency,
  formatRelativeTime,
} from './recommendations';
