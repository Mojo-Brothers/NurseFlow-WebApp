/**
 * NurseFlow Enterprise HIS 2026 — Cryptographic Clinical Document Signing Architecture
 * Standards: Permenkes No. 24/2022 (Tanda Tangan Elektronik RME), BSrE/BSSN Digital Signature Envelope,
 * RFC 8785 (JSON Canonicalization Scheme), NIST FIPS 186-5 (ECDSA P-256).
 */

import crypto from 'crypto';

export class ClinicalDocumentSignerService {
  /**
   * Deterministic Canonicalization of JSON Document (RFC 8785)
   */
  canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalize(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + this.canonicalize(obj[k])).join(',') + '}';
  }

  /**
   * Generate Practitioner ECDSA P-256 Cryptographic Keypair
   */
  generatePractitionerKeypair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1', // NIST P-256 / secp256r1
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    return { privateKeyPem: privateKey, publicKeyPem: publicKey };
  }

  /**
   * Sign a Clinical Document (SOAP Note, eMAR Record, Surgical Protocol)
   */
  signDocument({
    document = {},
    privateKeyPem,
    signer = {} // { doctorId, doctorName, sipNumber, role }
  }) {
    if (!privateKeyPem) throw new Error('Private key is mandatory for digital signing');

    // 1. Canonicalize Document
    const canonicalString = this.canonicalize(document);

    // 2. Compute SHA-256 Document Content Digest
    const contentDigest = crypto.createHash('sha256').update(canonicalString).digest('hex');

    // 3. Asymmetric ECDSA Signature
    const sign = crypto.createSign('SHA256');
    sign.update(contentDigest);
    sign.end();
    const signatureHex = sign.sign(privateKeyPem, 'hex');

    // 4. Construct Digital Signature Envelope
    const envelope = {
      envelopeId: `SIG-ENV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      algorithm: 'ECDSA_SHA256_P256',
      contentDigestSha256: contentDigest,
      signatureHex,
      signedAt: new Date().toISOString(),
      signer: {
        id: signer.doctorId || signer.id,
        name: signer.doctorName || signer.name,
        role: signer.role || 'DOCTOR_DPJP',
        sipNumber: signer.sipNumber || 'SIP-2026-MED-001',
        publicKeyPem: signer.publicKeyPem
      }
    };

    return envelope;
  }

  /**
   * Verify Digital Signature & Tamper Detection of a Clinical Document
   */
  verifyDocumentSignature({
    document = {},
    signatureEnvelope = {}
  }) {
    const {
      contentDigestSha256,
      signatureHex,
      signer
    } = signatureEnvelope;

    if (!signer || !signer.publicKeyPem || !signatureHex) {
      return {
        isValid: false,
        error: 'INVALID_ENVELOPE_METADATA_MISSING',
        isTampered: true
      };
    }

    // 1. Recompute Document Canonical Hash
    const canonicalString = this.canonicalize(document);
    const recomputedDigest = crypto.createHash('sha256').update(canonicalString).digest('hex');

    // Content Integrity Check
    if (recomputedDigest !== contentDigestSha256) {
      return {
        isValid: false,
        error: 'CONTENT_DIGEST_MISMATCH_DOCUMENT_ALTERED',
        isTampered: true,
        expectedDigest: contentDigestSha256,
        actualDigest: recomputedDigest
      };
    }

    // 2. Cryptographic Public Key Signature Verification
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(recomputedDigest);
      verify.end();
      const isSignatureValid = verify.verify(signer.publicKeyPem, signatureHex, 'hex');

      return {
        isValid: isSignatureValid,
        isTampered: !isSignatureValid,
        error: isSignatureValid ? null : 'CRYPTOGRAPHIC_SIGNATURE_INVALID',
        signer: signer.name,
        verifiedDigest: recomputedDigest
      };
    } catch (err) {
      return {
        isValid: false,
        isTampered: true,
        error: `VERIFICATION_EXCEPTION: ${err.message}`
      };
    }
  }
}

export const clinicalDocumentSignerService = new ClinicalDocumentSignerService();
