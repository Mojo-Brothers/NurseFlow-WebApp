/**
 * NURSEFLOW ENTERPRISE HIS — SATUSEHAT FHIR OPERATIONOUTCOME PARSER
 * Standardized semantic parser for FHIR R4 OperationOutcome resources.
 * Extracts severity, issue codes, diagnostics, and specific JSON element locations.
 */

export class OperationOutcomeParser {
  /**
   * Parse raw FHIR response body or error object into structured diagnostic summary
   */
  static parse(responseBody) {
    if (!responseBody || typeof responseBody !== 'object') {
      return {
        isOperationOutcome: false,
        summary: String(responseBody || 'No response body provided'),
        issues: []
      };
    }

    // Check if body is standard FHIR OperationOutcome
    if (responseBody.resourceType === 'OperationOutcome') {
      const rawIssues = Array.isArray(responseBody.issue) ? responseBody.issue : [];
      const parsedIssues = rawIssues.map((issue, idx) => ({
        index: idx + 1,
        severity: issue.severity || 'error', // fatal | error | warning | information
        code: issue.code || 'unknown',       // structure | required | value | not-found | etc.
        diagnostics: issue.diagnostics || issue.details?.text || 'No diagnostic message provided',
        location: Array.isArray(issue.location) ? issue.location.join(', ') : (issue.location || ''),
        expression: Array.isArray(issue.expression) ? issue.expression.join(', ') : (issue.expression || '')
      }));

      const hasFatalOrError = parsedIssues.some(i => i.severity === 'fatal' || i.severity === 'error');
      const hasWarning = parsedIssues.some(i => i.severity === 'warning');

      return {
        isOperationOutcome: true,
        hasError: hasFatalOrError,
        hasWarning: hasWarning,
        issueCount: parsedIssues.length,
        primaryDiagnostics: parsedIssues[0]?.diagnostics || 'OperationOutcome received',
        issues: parsedIssues
      };
    }

    // Non-OperationOutcome JSON error or response
    return {
      isOperationOutcome: false,
      hasError: Boolean(responseBody.error || responseBody.message),
      summary: responseBody.error || responseBody.message || JSON.stringify(responseBody),
      issues: []
    };
  }

  /**
   * Format issues into human-readable diagnostic message for developer / audit logs
   */
  static formatForAudit(parsedOutcome) {
    if (!parsedOutcome.isOperationOutcome) {
      return parsedOutcome.summary;
    }

    return parsedOutcome.issues.map(i => 
      `[${i.severity.toUpperCase()}:${i.code}] ${i.diagnostics} (Location: ${i.expression || i.location || 'root'})`
    ).join(' | ');
  }
}

export default OperationOutcomeParser;
