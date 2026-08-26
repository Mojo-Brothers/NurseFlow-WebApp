/**
 * NurseFlow Enterprise HIS 2026 — Canonical API Response Helper
 * Standards: RFC 7231, RESTful Best Practices, JCI Traceability & Auditability
 * 
 * Response Formats:
 * Single:     { data: { ... }, meta: { correlationId: "...", ... } }
 * Collection: { data: [ ... ], meta: { page: 1, pageSize: 20, total: 100, totalPages: 5, correlationId: "...", ... } }
 * No Content: HTTP 204 Zero Body (noContent)
 */

export const respond = {
  /**
   * HTTP 200 OK — Single Entity Response
   */
  ok: (res, { data = {}, meta = {}, correlationId = null }) => {
    const corrId = correlationId || res.req?.correlationId || res.req?.headers?.['x-correlation-id'] || null;
    const finalMeta = { ...meta };
    if (corrId && !finalMeta.correlationId) {
      finalMeta.correlationId = corrId;
    }
    if (typeof res.setHeader === 'function' && corrId) {
      res.setHeader('X-Correlation-ID', corrId);
    }
    return res.status(200).json({
      data,
      meta: finalMeta
    });
  },

  /**
   * HTTP 201 Created — Resource Creation Response
   */
  created: (res, { data = {}, meta = {}, correlationId = null }) => {
    const corrId = correlationId || res.req?.correlationId || res.req?.headers?.['x-correlation-id'] || null;
    const finalMeta = { ...meta };
    if (corrId && !finalMeta.correlationId) {
      finalMeta.correlationId = corrId;
    }
    if (typeof res.setHeader === 'function' && corrId) {
      res.setHeader('X-Correlation-ID', corrId);
    }
    return res.status(201).json({
      data,
      meta: finalMeta
    });
  },

  /**
   * HTTP 200 OK — Paginated Collection Response
   */
  collection: (res, {
    data = [],
    page = 1,
    pageSize = 20,
    total = undefined,
    meta = {},
    correlationId = null
  }) => {
    const corrId = correlationId || res.req?.correlationId || res.req?.headers?.['x-correlation-id'] || null;
    const totalCount = Number(total !== undefined ? total : data.length) || 0;
    const resolvedPageSize = Number(pageSize) || 20;
    const totalPages = Math.ceil(totalCount / resolvedPageSize) || 1;
    const finalMeta = {
      page: Number(page) || 1,
      pageSize: resolvedPageSize,
      total: totalCount,
      totalPages,
      ...meta
    };
    if (corrId && !finalMeta.correlationId) {
      finalMeta.correlationId = corrId;
    }
    if (typeof res.setHeader === 'function' && corrId) {
      res.setHeader('X-Correlation-ID', corrId);
    }
    return res.status(200).json({
      data,
      meta: finalMeta
    });
  },

  /**
   * HTTP 204 No Content — Zero Body
   */
  noContent: (res) => {
    return res.status(204).end();
  }
};

