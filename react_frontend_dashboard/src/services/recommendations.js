/**
 * PUBLIC_INTERFACE
 * JS facade for recommendations service.
 * Avoid default export to prevent circular default<->named re-export loops.
 * Export named symbols only.
 */
export {
  getRecommendations,
  // Backward compatibility export name (old selector) mapped to new implementation
  selectTopHighPriorityRecommendations as selectTopHighRiskRecommendations,
  selectTopHighPriorityRecommendations,
  formatCurrency,
  formatRelativeTime,
} from './recommendations';
