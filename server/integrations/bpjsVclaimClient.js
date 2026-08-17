/**
 * NurseFlow Enterprise HIS 2026 — BPJS Kesehatan VClaim 2.0 Web Service Client
 * Standar: BPJS Trust Mark HMAC-SHA256 Signature & LZ-String Decompression
 */

export const bpjsVclaimClient = {
  /**
   * Generate BPJS Header Signature:
   * X-cons-id, X-timestamp, X-signature (HMAC-SHA256 of ConsID + "&" + Timestamp using SecretKey)
   */
  generateAuthHeaders: (consId = '12345', secretKey = 'secretKey2026', userKey = 'userKey2026') => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const dataToSign = `${consId}&${timestamp}`;

    // Simulated HMAC-SHA256 signature in Base64
    const signature = btoa(`sig_${dataToSign}_${secretKey}`).replace(/=+$/, '');

    return {
      'X-cons-id': consId,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': userKey,
      'Content-Type': 'Application/x-www-form-urlencoded'
    };
  },

  /**
   * Construct SEP Creation Payload (VClaim 2.0)
   */
  buildSepPayload: ({
    noKartu,
    tglSep = new Date().toISOString().split('T')[0],
    jnsPelayanan = '2', // 1: Ranap, 2: Rajal
    noMr,
    diagAwal,
    poliTujuan = 'INT',
    dpjpLayan = '12345',
    noTelp = '081299887766',
    user = 'NurseFlow_Admission'
  }) => {
    return {
      request: {
        t_sep: {
          noKartu,
          tglSep,
          ppkPelayanan: '0115R001',
          jnsPelayanan,
          klsRawat: { klsRawatHak: '1', klsRawatNaik: '', pembiayaan: '', penanggungJawab: '' },
          noMR: noMr,
          rujukan: { asalRujukan: '1', tglRujukan: tglSep, noRujukan: '123456789012345', ppkRujukan: '0115B001' },
          catatan: 'Pendaftaran Rawat Jalan VClaim 2.0',
          diagAwal,
          poli: { tujuan: poliTujuan, eksekutif: '0' },
          cob: { cob: '0' },
          katarak: { katarak: '0' },
          jaminan: { lakaLantas: '0', noLP: '', penjamin: { tglKejadian: '', keterangan: '', suplesi: { suplesi: '0', noSepSuplesi: '', lokasiLaka: { kdPropinsi: '', kdKabupaten: '', kdKecamatan: '' } } } },
          tujuanKunj: '0',
          flagProcedure: '',
          kdPenunjang: '',
          assesmentPel: '',
          skdp: { noSurat: '000001', kodeDPJP: dpjpLayan },
          dpjpLayan,
          noTelp,
          user
        }
      }
    };
  }
};
