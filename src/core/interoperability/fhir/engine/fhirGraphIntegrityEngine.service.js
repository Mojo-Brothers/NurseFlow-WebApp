/**
 * NurseFlow Enterprise HIS 2026 — FHIR R4 Clinical Graph Integrity Engine
 * Standards: HL7 FHIR R4 Bundle Specification (Normative), Transaction & Batch Semantics,
 * Reference Resolution, Orphan Detection, Prohibited Cycles, Referential Type Safety, Identity Collision.
 * 
 * Philosophy: A collection of valid individual resources != A valid clinical graph.
 * Output: Graph Validation Explainability (Tree Rendering) + Machine-Readable Diagnostics.
 */

import { KEMKES_SYSTEMS } from '../profiles/kemkesProfiles.js';

export const REFERENTIAL_TYPE_CONSTRAINTS = Object.freeze({
  'Encounter.subject': ['Patient', 'Group'],
  'Condition.subject': ['Patient', 'Group'],
  'Condition.encounter': ['Encounter'],
  'Observation.subject': ['Patient', 'Group', 'Device', 'Location'],
  'Observation.encounter': ['Encounter'],
  'Procedure.subject': ['Patient', 'Group'],
  'Procedure.encounter': ['Encounter'],
  'MedicationRequest.subject': ['Patient', 'Group'],
  'MedicationRequest.encounter': ['Encounter'],
  'DiagnosticReport.subject': ['Patient', 'Group', 'Device', 'Location'],
  'DiagnosticReport.encounter': ['Encounter']
});

export class FhirGraphIntegrityEngineService {
  /**
   * Evaluate Full Bundle Graph Integrity across 7 Integrity Layers
   */
  evaluateBundleGraph(bundle) {
    const issues = {
      errors: [],
      warnings: [],
      information: []
    };

    const addIssue = (layer, severity, code, path, message, details = {}) => {
      const issue = {
        layer,
        severity,
        code,
        path,
        message,
        details
      };
      if (severity === 'error') {
        issues.errors.push(issue);
      } else if (severity === 'warning') {
        issues.warnings.push(issue);
      } else {
        issues.information.push(issue);
      }
    };

    // ------------------------------------------------------------------------
    // L1: BUNDLE STRUCTURAL INTEGRITY & TRANSACTION SEMANTICS
    // ------------------------------------------------------------------------
    if (!bundle || typeof bundle !== 'object' || bundle.resourceType !== 'Bundle') {
      addIssue('L1_STRUCTURAL', 'error', 'invalid-bundle-type', 'Bundle.resourceType', 'Input must be a valid FHIR R4 Bundle object');
      return this._buildResult(bundle, issues, null);
    }

    const VALID_BUNDLE_TYPES = new Set(['transaction', 'batch', 'collection', 'document', 'message', 'searchset', 'history']);
    if (!bundle.type || !VALID_BUNDLE_TYPES.has(bundle.type)) {
      addIssue('L1_STRUCTURAL', 'error', 'invalid-type-code', 'Bundle.type', `Bundle.type must be one of: ${Array.from(VALID_BUNDLE_TYPES).join(', ')}`);
    }

    if (!Array.isArray(bundle.entry) || bundle.entry.length === 0) {
      addIssue('L1_STRUCTURAL', 'error', 'empty-bundle', 'Bundle.entry', 'Bundle must contain at least one entry');
      return this._buildResult(bundle, issues, null);
    }

    // Transaction & Batch method check
    if (bundle.type === 'transaction' || bundle.type === 'batch') {
      for (let i = 0; i < bundle.entry.length; i++) {
        const e = bundle.entry[i];
        if (!e.request || !e.request.method || !e.request.url) {
          addIssue('L7_TRANSACTION_SEMANTICS', 'error', 'missing-request-header', `Bundle.entry[${i}].request`, `Bundle of type "${bundle.type}" requires request.method and request.url on each entry`);
        }
      }
    }

    // ------------------------------------------------------------------------
    // L2 & L6: INDEXING, RESOLUTION MAP & DUPLICATE IDENTITY DETECTION
    // ------------------------------------------------------------------------
    const resourceIndex = new Map(); // key -> { resource, entryIndex, fullUrl }
    const identityMap = new Map(); // 'System|Value' -> resourceKey (for identity collision detection)

    for (let i = 0; i < bundle.entry.length; i++) {
      const entry = bundle.entry[i];
      const res = entry.resource;
      if (!res) {
        addIssue('L1_STRUCTURAL', 'error', 'missing-resource', `Bundle.entry[${i}].resource`, 'Bundle entry contains null or missing resource');
        continue;
      }

      const resKey = `${res.resourceType}/${res.id}`;
      const fullUrlKey = entry.fullUrl;

      // Duplicate Key / Collision Check
      if (resourceIndex.has(resKey)) {
        const existing = resourceIndex.get(resKey);
        const isIdentical = JSON.stringify(existing.resource) === JSON.stringify(res);
        if (isIdentical) {
          addIssue('L6_DUPLICATE_IDENTITY', 'warning', 'duplicate-exact-resource', `Bundle.entry[${i}]`, `Entry #${i} is an exact duplicate of entry #${existing.entryIndex} (${resKey})`);
        } else {
          addIssue('L6_DUPLICATE_IDENTITY', 'error', 'conflicting-duplicate-identity', `Bundle.entry[${i}]`, `Entry #${i} has conflicting body with entry #${existing.entryIndex} for same ID ${resKey}`);
        }
      } else {
        const nodeInfo = { resource: res, entryIndex: i, fullUrl: fullUrlKey, outgoingRefs: [], incomingRefs: [] };
        resourceIndex.set(resKey, nodeInfo);
        if (fullUrlKey) {
          resourceIndex.set(fullUrlKey, nodeInfo);
        }
      }

      // Check NIK Collision (2 different Patient IDs with same NIK)
      if (res.resourceType === 'Patient' && Array.isArray(res.identifier)) {
        for (const ident of res.identifier) {
          if (ident.system === KEMKES_SYSTEMS.NIK && ident.value) {
            const idKey = `NIK|${ident.value}`;
            if (identityMap.has(idKey)) {
              const prevKey = identityMap.get(idKey);
              if (prevKey !== resKey) {
                addIssue('L6_DUPLICATE_IDENTITY', 'error', 'duplicate-canonical-identity', `Bundle.entry[${i}].identifier`, `Patient ${resKey} has colliding NIK ${ident.value} with ${prevKey}`);
              }
            } else {
              identityMap.set(idKey, resKey);
            }
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // L3 & L4 & L5: EXTRACT EDGES, RESOLVE REFS, CHECK TYPE SAFETY & CYCLES
    // ------------------------------------------------------------------------
    const adjacencyList = new Map(); // sourceKey -> [targetKey]

    for (const [key, node] of resourceIndex.entries()) {
      if (key.startsWith('urn:') || key.startsWith('http')) continue; // Skip alias keys
      adjacencyList.set(key, []);

      const outgoing = this._extractResourceReferences(node.resource);

      for (const refItem of outgoing) {
        const targetRefStr = refItem.reference;
        const targetNode = resourceIndex.get(targetRefStr);

        // L2 / L3: Orphan Check (Cannot Resolve)
        if (!targetNode) {
          addIssue('L3_ORPHAN_DETECTION', 'error', 'unresolvable-reference', refItem.path, `Reference "${targetRefStr}" from ${key} cannot be resolved in Bundle (Orphan Node detected)`, {
            source: key,
            targetRef: targetRefStr
          });
          continue;
        }

        const targetKey = `${targetNode.resource.resourceType}/${targetNode.resource.id}`;
        adjacencyList.get(key).push(targetKey);
        node.outgoingRefs.push({ path: refItem.path, targetKey });
        targetNode.incomingRefs.push({ sourceKey: key, path: refItem.path });

        // L5: Referential Type Safety
        const constraintKey = `${node.resource.resourceType}.${refItem.field}`;
        const allowedTypes = REFERENTIAL_TYPE_CONSTRAINTS[constraintKey];
        if (allowedTypes) {
          const actualTargetType = targetNode.resource.resourceType;
          if (!allowedTypes.includes(actualTargetType)) {
            addIssue('L5_TYPE_SAFETY', 'error', 'referential-type-mismatch', refItem.path, `Field "${constraintKey}" must point to [${allowedTypes.join(', ')}], but points to "${actualTargetType}" (${targetRefStr})`, {
              source: key,
              target: targetKey,
              expectedTypes: allowedTypes,
              actualType: actualTargetType
            });
          }
        }

        // L4: Self-Loop Detection
        if (key === targetKey) {
          addIssue('L4_CYCLE_POLICY', 'error', 'prohibited-self-reference', refItem.path, `Resource ${key} contains an illegal self-referential loop on "${refItem.path}"`);
        }
      }
    }

    // L4: Prohibited Cycle Detection (DFS Cycle Detection on strict dependencies)
    const cycleDetected = this._detectProhibitedCycles(adjacencyList);
    if (cycleDetected) {
      addIssue('L4_CYCLE_POLICY', 'error', 'prohibited-graph-cycle', 'Bundle.graph', `Prohibited circular reference cycle detected in clinical graph: ${cycleDetected.join(' -> ')}`);
    }

    // ------------------------------------------------------------------------
    // BUILD GRAPH EXPLAINABILITY TREE
    // ------------------------------------------------------------------------
    const graphForest = this._buildClinicalGraphForest(resourceIndex);
    const treeText = this.renderGraphTree(graphForest);

    return this._buildResult(bundle, issues, graphForest, treeText);
  }

  /**
   * Extract all reference fields from a FHIR resource
   */
  _extractResourceReferences(res) {
    const refs = [];
    if (!res || typeof res !== 'object') return refs;

    const traverse = (obj, currentPath) => {
      if (!obj || typeof obj !== 'object') return;

      if (obj.reference && typeof obj.reference === 'string') {
        const fieldName = currentPath.split('.').pop();
        refs.push({ path: currentPath, field: fieldName, reference: obj.reference });
      }

      for (const [k, v] of Object.entries(obj)) {
        if (k === 'reference' && typeof v === 'string') continue;
        if (typeof v === 'object' && v !== null) {
          traverse(v, currentPath ? `${currentPath}.${k}` : k);
        }
      }
    };

    traverse(res, res.resourceType);
    return refs;
  }

  /**
   * Detect Prohibited Circular References using DFS
   */
  _detectProhibitedCycles(adjacencyList) {
    const visited = new Set();
    const recStack = new Set();
    const cyclePath = [];

    const dfs = (node, path) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const res = dfs(neighbor, path);
          if (res) return res;
        } else if (recStack.has(neighbor)) {
          path.push(neighbor);
          return path;
        }
      }

      recStack.delete(node);
      path.pop();
      return null;
    };

    for (const node of adjacencyList.keys()) {
      if (!visited.has(node)) {
        const cycle = dfs(node, []);
        if (cycle) return cycle;
      }
    }
    return null;
  }

  /**
   * Construct Graph Forest (Roots are Patients / Encounters without incoming refs)
   */
  _buildClinicalGraphForest(resourceIndex) {
    const nodes = [];
    const roots = [];

    for (const [key, node] of resourceIndex.entries()) {
      if (key.startsWith('urn:') || key.startsWith('http')) continue;
      nodes.push(node);

      if (node.resource.resourceType === 'Patient') {
        roots.push(node);
      }
    }

    // If no Patient is root, pick nodes without outgoing references
    if (roots.length === 0) {
      for (const [key, node] of resourceIndex.entries()) {
        if (key.startsWith('urn:') || key.startsWith('http')) continue;
        if (node.outgoingRefs.length === 0) {
          roots.push(node);
        }
      }
    }

    return { roots, totalNodes: nodes.length, resourceIndex };
  }

  /**
   * Render Tree Structure in Text for Human & Audit Explainability
   */
  renderGraphTree(graphForest) {
    if (!graphForest || !graphForest.roots) return 'Empty Graph';

    const lines = [];
    const visited = new Set();

    const getChildrenForNode = (node) => {
      const res = node.resource;
      if (res.resourceType === 'Patient') {
        // Find Encounters for this Patient
        return node.incomingRefs
          .map(r => graphForest.resourceIndex.get(r.sourceKey))
          .filter(childNode => childNode && childNode.resource.resourceType === 'Encounter');
      }
      if (res.resourceType === 'Encounter') {
        // Find Clinical items pointing to this Encounter
        return node.incomingRefs
          .map(r => graphForest.resourceIndex.get(r.sourceKey))
          .filter(childNode => childNode && childNode.resource.resourceType !== 'Patient');
      }
      return [];
    };

    const printNode = (node, prefix = '', isLast = true) => {
      const res = node.resource;
      const nodeKey = `${res.resourceType}/${res.id}`;
      let label = nodeKey;

      if (res.resourceType === 'Patient' && res.name?.[0]?.text) {
        label += ` (${res.name[0].text})`;
      } else if (res.resourceType === 'Condition' && res.code?.coding?.[0]?.code) {
        label += ` [ICD-10: ${res.code.coding[0].code}]`;
      } else if (res.resourceType === 'Observation' && res.code?.coding?.[0]?.code) {
        label += ` [LOINC: ${res.code.coding[0].code}]`;
      } else if (res.resourceType === 'Procedure' && res.code?.coding?.[0]?.code) {
        label += ` [ICD-9: ${res.code.coding[0].code}]`;
      } else if (res.resourceType === 'MedicationRequest' && res.medicationCodeableConcept?.coding?.[0]?.code) {
        label += ` [KFA: ${res.medicationCodeableConcept.coding[0].code}]`;
      } else if (res.resourceType === 'DiagnosticReport' && res.code?.coding?.[0]?.code) {
        label += ` [LOINC: ${res.code.coding[0].code}]`;
      }

      if (visited.has(nodeKey)) {
        lines.push(`${prefix}${isLast ? '└─ ' : '├─ '}${label} [CYCLE DETECTED ⚠️]`);
        return;
      }
      visited.add(nodeKey);

      lines.push(`${prefix}${isLast ? '└─ ' : '├─ '}${label}`);

      const children = getChildrenForNode(node);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        printNode(child, nextPrefix, i === children.length - 1);
      }
    };

    for (let r = 0; r < graphForest.roots.length; r++) {
      const root = graphForest.roots[r];
      printNode(root, '', r === graphForest.roots.length - 1);
    }

    return lines.join('\n');
  }

  _buildResult(bundle, issues, graphForest, treeText = '') {
    const isConformant = issues.errors.length === 0;
    let decision = 'CONFORMANT';
    if (!isConformant) {
      decision = 'REJECTED';
    } else if (issues.warnings.length > 0) {
      decision = 'CONFORMANT_WITH_WARNINGS';
    }

    return {
      isConformant,
      decision,
      bundleType: bundle?.type || 'unknown',
      totalEntries: Array.isArray(bundle?.entry) ? bundle.entry.length : 0,
      totalErrors: issues.errors.length,
      totalWarnings: issues.warnings.length,
      graphTree: treeText,
      errors: issues.errors,
      warnings: issues.warnings,
      information: issues.information
    };
  }
}

export const fhirGraphIntegrityEngineService = new FhirGraphIntegrityEngineService();
