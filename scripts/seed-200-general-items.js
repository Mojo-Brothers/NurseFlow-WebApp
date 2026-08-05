import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain: "nurseflow-309c7.firebaseapp.com",
  projectId: "nurseflow-309c7",
  storageBucket: "nurseflow-309c7.firebasestorage.app",
  messagingSenderId: "381014626562",
  appId: "1:381014626562:web:be60f5d1d3d7d25038b21b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEPOS = ['DEPO_LOGISTIK_UMUM', 'GUDANG_RUMAH_TANGGA', 'GUDANG_LINEN_LAUNDRY', 'GUDANG_ATK_PERCETAKAN', 'DEPO_RAWAT_INAP'];

// 200 GENERAL NON-MEDICAL WAREHOUSE ITEMS RAW LIST
const GENERAL_ITEMS_RAW = [
  // 1-50: ALAT TULIS KANTOR (ATK) & KERTAS
  { name: 'Kertas HVS A4 70gr Sinar Dunia (Box 5 Ream)', cat: 'NON_MEDIS', unit: 'Box', price: 235000 },
  { name: 'Kertas HVS A4 80gr PaperOne (Box 5 Ream)', cat: 'NON_MEDIS', unit: 'Box', price: 265000 },
  { name: 'Kertas HVS F4 70gr Sinar Dunia (Box 5 Ream)', cat: 'NON_MEDIS', unit: 'Box', price: 255000 },
  { name: 'Kertas Thermal Kasir / Antrean 80x80mm Box 50 Roll', cat: 'NON_MEDIS', unit: 'Box', price: 380000 },
  { name: 'Kertas Thermal EKG 3-Channel 60mm x 30m Roll', cat: 'NON_MEDIS', unit: 'Roll', price: 28000 },
  { name: 'Pulpen Snowman V-1 0.7mm Warna Hitam Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 24000 },
  { name: 'Pulpen Snowman V-1 0.7mm Warna Biru Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 24000 },
  { name: 'Pulpen Snowman V-1 0.7mm Warna Merah Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 24000 },
  { name: 'Pulpen Gel Pilot G2 0.5mm Hitam Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 185000 },
  { name: 'Pensil 2B Faber Castell Box 12 Pcs', cat: 'NON_MEDIS', unit: 'Box', price: 42000 },
  { name: 'Penghapus Pensil Faber Castell Dust Free Box 40', cat: 'NON_MEDIS', unit: 'Box', price: 65000 },
  { name: 'Penggaris Besi Stainless 30cm Joyko', cat: 'NON_MEDIS', unit: 'Pcs', price: 12500 },
  { name: 'Binder Clip Joyko No. 107 (Kecil) Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 8500 },
  { name: 'Binder Clip Joyko No. 155 (Sedang) Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 14500 },
  { name: 'Binder Clip Joyko No. 260 (Besar) Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 28000 },
  { name: 'Paper Clip / Trigonal Clip No. 3 Joyko Box 10', cat: 'NON_MEDIS', unit: 'Box', price: 18000 },
  { name: 'Stapler Joyko HD-10 Plastik', cat: 'NON_MEDIS', unit: 'Pcs', price: 14500 },
  { name: 'Isi Staples Joyko No. 10 Box 20 Kecil', cat: 'NON_MEDIS', unit: 'Box', price: 32000 },
  { name: 'Stapler Heavy Duty Joyko HD-12N/17 (Besar)', cat: 'NON_MEDIS', unit: 'Pcs', price: 185000 },
  { name: 'Pelubang Kertas / Perforator Joyko No. 30XL', cat: 'NON_MEDIS', unit: 'Pcs', price: 32000 },
  { name: 'Gunting Stainless Medium Kenko SC-838', cat: 'NON_MEDIS', unit: 'Pcs', price: 16500 },
  { name: 'Cutter Kenko L-500 Besar Stainless', cat: 'NON_MEDIS', unit: 'Pcs', price: 18500 },
  { name: 'Isi Pisau Cutter Kenko L-150 Box 10 Tube', cat: 'NON_MEDIS', unit: 'Box', price: 45000 },
  { name: 'Lakban Bening Daimaru 2 Inchi x 90 Yard', cat: 'NON_MEDIS', unit: 'Roll', price: 16500 },
  { name: 'Lakban Coklat Daimaru 2 Inchi x 90 Yard', cat: 'NON_MEDIS', unit: 'Roll', price: 16500 },
  { name: 'Lakban Kertas / Masking Tape Daimaru 1 Inchi', cat: 'NON_MEDIS', unit: 'Roll', price: 12000 },
  { name: 'Double Tape Foam Hijau 1 Inchi 3M Roll', cat: 'NON_MEDIS', unit: 'Roll', price: 28000 },
  { name: 'Post-it Notes Kuning 3x3 Inchi 3M Pad 100', cat: 'NON_MEDIS', unit: 'Pad', price: 14500 },
  { name: 'Buku Ekspedisi Poliklinik Hardcover 100 Lembar', cat: 'NON_MEDIS', unit: 'Buku', price: 28000 },
  { name: 'Buku Register Pasien Rawat Inap Hardcover 200L', cat: 'NON_MEDIS', unit: 'Buku', price: 45000 },

  // 51-100: PERCETAKAN DOKUMEN & FORMULIR REKAM MEDIS
  { name: 'Formulir Resume Medis Pasien Pulang (Rim 500L)', cat: 'NON_MEDIS', unit: 'Rim', price: 85000 },
  { name: 'Formulir Asesmen Awal Keperawatan IGD (Rim 500L)', cat: 'NON_MEDIS', unit: 'Rim', price: 85000 },
  { name: 'Formulir Inform Consent Persetujuan Tindakan (Rim)', cat: 'NON_MEDIS', unit: 'Rim', price: 90000 },
  { name: 'Formulir Lembar Resep Dokter Rawat Jalan (Rim)', cat: 'NON_MEDIS', unit: 'Rim', price: 75000 },
  { name: 'Formulir Catatan Perkembangan Pasien Terintegrasi (CPPT)', cat: 'NON_MEDIS', unit: 'Rim', price: 85000 },
  { name: 'Formulir Grafik Vital Sign Suhu & Nadi (Rim 500L)', cat: 'NON_MEDIS', unit: 'Rim', price: 78000 },
  { name: 'Formulir Transfer Pasien Inter-Departemen (Rim)', cat: 'NON_MEDIS', unit: 'Rim', price: 82000 },
  { name: 'Map Snelhecter Plastik Transparan Biru Box 12', cat: 'NON_MEDIS', unit: 'Box', price: 48000 },
  { name: 'Map Folder Rekam Medis Karton Cetak Logo RS Pack 100', cat: 'NON_MEDIS', unit: 'Pack', price: 240000 },
  { name: 'Amplop Coklat Rontgen X-Ray Size 35x45cm Pack 100', cat: 'NON_MEDIS', unit: 'Pack', price: 185000 },
  { name: 'Amplop Surat Resmi RS Cetak Logo Size Kabinet Pack 100', cat: 'NON_MEDIS', unit: 'Pack', price: 65000 },
  { name: 'Roll Stiker Barcode Gelang Pasien 50x20mm 1000 Pcs', cat: 'NON_MEDIS', unit: 'Roll', price: 75000 },
  { name: 'Tinta Printer Epson Original 003 Hitam Botol 65ml', cat: 'NON_MEDIS', unit: 'Botol', price: 95000 },
  { name: 'Tinta Printer Epson Original 003 Cyan Botol 65ml', cat: 'NON_MEDIS', unit: 'Botol', price: 95000 },
  { name: 'Tinta Printer Epson Original 003 Magenta Botol 65ml', cat: 'NON_MEDIS', unit: 'Botol', price: 95000 },
  { name: 'Tinta Printer Epson Original 003 Yellow Botol 65ml', cat: 'NON_MEDIS', unit: 'Botol', price: 95000 },
  { name: 'Ribbon Barcode Printer Thermal Wax Resin 110x300m', cat: 'NON_MEDIS', unit: 'Roll', price: 115000 },
  { name: 'Tinta Stempel Otomatis Yamura Warna Biru 50ml', cat: 'NON_MEDIS', unit: 'Botol', price: 22000 },
  { name: 'Stempel Tanggal Otomatis Shiny Dater S-300', cat: 'NON_MEDIS', unit: 'Pcs', price: 85000 },
  { name: 'Bantal Stempel / Stamp Pad Hero No. 1', cat: 'NON_MEDIS', unit: 'Pcs', price: 18500 },

  // 101-150: SANITASI, KEBERSIHAN & DESINFEKTAN
  { name: 'Hand Soap Antiseptik Refill Jerigen 5 Liter', cat: 'NON_MEDIS', unit: 'Jerigen', price: 95000 },
  { name: 'Hand Sanitizer Liquid Refill Jerigen 5 Liter 70% Alc', cat: 'NON_MEDIS', unit: 'Jerigen', price: 185000 },
  { name: 'Hand Sanitizer Gel Pump 500ml Botol (Diversey)', cat: 'NON_MEDIS', unit: 'Botol', price: 42000 },
  { name: 'Floor Cleaner Desinfektan Karbol Sereh Jerigen 5L', cat: 'NON_MEDIS', unit: 'Jerigen', price: 78000 },
  { name: 'Pembersih Kaca Glass Cleaner Refill Jerigen 5 Liter', cat: 'NON_MEDIS', unit: 'Jerigen', price: 65000 },
  { name: 'Pembersih Porselen & Keramik Closet Jerigen 5L', cat: 'NON_MEDIS', unit: 'Jerigen', price: 88000 },
  { name: 'Deterjen Laundry Hospital Grade Low Suds 10kg Bag', cat: 'NON_MEDIS', unit: 'Bag', price: 240000 },
  { name: 'Bleach / Pemutih Desinfektan Chlorine Jerigen 5L', cat: 'NON_MEDIS', unit: 'Jerigen', price: 68000 },
  { name: 'Softener Pellembut Kain Laundry Jerigen 5 Liter', cat: 'NON_MEDIS', unit: 'Jerigen', price: 75000 },
  { name: 'Tissue Facial Paseo 250 Sheets 2-Ply Pack', cat: 'NON_MEDIS', unit: 'Pack', price: 16500 },
  { name: 'Tissue Roll Toilet Livi Jumbo Roll 300m Box 16 Roll', cat: 'NON_MEDIS', unit: 'Box', price: 280000 },
  { name: 'Tissue Hand Towel Interfold Livi Fold 150s Pack', cat: 'NON_MEDIS', unit: 'Pack', price: 12500 },
  { name: 'Kantong Plastik Kuning Infeksius Size 60x80cm Pack 50', cat: 'NON_MEDIS', unit: 'Pack', price: 65000 },
  { name: 'Kantong Plastik Hitam Domestik Size 60x80cm Pack 50', cat: 'NON_MEDIS', unit: 'Pack', price: 45000 },
  { name: 'Kantong Plastik Ungu Sitotoksik Size 60x80cm Pack 50', cat: 'NON_MEDIS', unit: 'Pack', price: 85000 },
  { name: 'Wadah Safety Box Limbah Medis Jarum 5 Liter Pcs', cat: 'NON_MEDIS', unit: 'Pcs', price: 22000 },
  { name: 'Sapu Nilon Lantai Handle Aluminium Nagoya', cat: 'NON_MEDIS', unit: 'Pcs', price: 38000 },
  { name: 'Kain Pel Microfiber Set Bucket Nagoya Heavy Duty', cat: 'NON_MEDIS', unit: 'Set', price: 185000 },
  { name: 'Refill Kain Pel Microfiber Cotton Nagoya', cat: 'NON_MEDIS', unit: 'Pcs', price: 28000 },
  { name: 'Wiper Kaca Floor Squeegee Rubber 45cm', cat: 'NON_MEDIS', unit: 'Pcs', price: 48000 },
  { name: 'Trolley Mop Double Bucket Janitorial 36 Liter', cat: 'NON_MEDIS', unit: 'Unit', price: 850000 },
  { name: 'Sikat WC Plastik Gagang Panjang Krisbow', cat: 'NON_MEDIS', unit: 'Pcs', price: 22000 },
  { name: 'Sarung Tangan Karet Heavy Duty Cleaning Size L', cat: 'NON_MEDIS', unit: 'Pasang', price: 18500 },
  { name: 'Kamfer Barus WC Swallow Balls 300gr Pack', cat: 'NON_MEDIS', unit: 'Pack', price: 28000 },
  { name: 'Air Sanitizer Aerosol Stella Fresh 400ml Can', cat: 'NON_MEDIS', unit: 'Can', price: 38000 },

  // 151-200: LINEN, PERLENGKAPAN RUANGAN, PANTRY & MAINTENANCE
  { name: 'Sprei Rumah Sakit Katun Putih Polos Size 120x200cm', cat: 'NON_MEDIS', unit: 'Pcs', price: 145000 },
  { name: 'Sarung Bantal RS Katun Putih Size 50x70cm', cat: 'NON_MEDIS', unit: 'Pcs', price: 35000 },
  { name: 'Selimut Pasien Selimut Flanel Lurik Biru RS', cat: 'NON_MEDIS', unit: 'Pcs', price: 95000 },
  { name: 'Handuk Mandi Pasien Katun Putih Size 70x140cm', cat: 'NON_MEDIS', unit: 'Pcs', price: 68000 },
  { name: 'Baju Pasien Rawat Inap Model Kimono Gown Unisex', cat: 'NON_MEDIS', unit: 'Pcs', price: 115000 },
  { name: 'Baju Operasi Dokter / Perawat OK Suit Hijau Size L', cat: 'NON_MEDIS', unit: 'Set', price: 185000 },
  { name: 'Waslap Mandi Pasien Katun Handuk Pack 10 Pcs', cat: 'NON_MEDIS', unit: 'Pack', price: 45000 },
  { name: 'Gorden Antibakteri Fire Retardant Ruang Inap Meter', cat: 'NON_MEDIS', unit: 'Meter', price: 165000 },
  { name: 'Perlak Plastik Waterproof Matrass Protector Size 120x200', cat: 'NON_MEDIS', unit: 'Pcs', price: 125000 },
  { name: 'Sandal Pasien Disposable Spunbond Pasang', cat: 'NON_MEDIS', unit: 'Pasang', price: 8500 },
  { name: 'Galon Air Mineral Aqua 19 Liter Refill', cat: 'NON_MEDIS', unit: 'Galon', price: 22000 },
  { name: 'Gelas Plastik Disposable 220ml Dus 2000 Pcs', cat: 'NON_MEDIS', unit: 'Dus', price: 185000 },
  { name: 'Sendok Plastik Disposable Transparan Dus 1000', cat: 'NON_MEDIS', unit: 'Dus', price: 95000 },
  { name: 'Teh Celup Sariwangi Box 100 Sachet', cat: 'NON_MEDIS', unit: 'Box', price: 24000 },
  { name: 'Kopi Kapal Api Special Sachet Box 120 Sachet', cat: 'NON_MEDIS', unit: 'Box', price: 145000 },
  { name: 'Gula Pasir Sachet 8gr Gulaku Box 250 Sachet', cat: 'NON_MEDIS', unit: 'Box', price: 68000 },
  { name: 'Baterai AA Energizer Alkaline Box 24 Pcs', cat: 'NON_MEDIS', unit: 'Box', price: 165000 },
  { name: 'Baterai AAA Energizer Alkaline Box 24 Pcs', cat: 'NON_MEDIS', unit: 'Box', price: 165000 },
  { name: 'Baterai 9V Block Energizer Industrial for Monitor', cat: 'NON_MEDIS', unit: 'Pcs', price: 48000 },
  { name: 'Lampu LED Philips 12 Watt Warm White / Cool Day', cat: 'NON_MEDIS', unit: 'Pcs', price: 48000 },
  { name: 'Lampu TL Neon Philips 36 Watt Tube 120cm', cat: 'NON_MEDIS', unit: 'Pcs', price: 32000 },
  { name: 'Stop Kontak 4 Lubang Kabel 5m Broco Heavy Duty', cat: 'NON_MEDIS', unit: 'Pcs', price: 95000 },
  { name: 'Kabel UTP Belden Cat6 High Speed Dus 305 Meter', cat: 'NON_MEDIS', unit: 'Dus', price: 2100000 },
  { name: 'Connector RJ45 AMP Cat6 Box 100 Pcs', cat: 'NON_MEDIS', unit: 'Box', price: 185000 },
  { name: 'Cable Tie Nylon 20cm x 3.6mm Pack 100 Pcs', cat: 'NON_MEDIS', unit: 'Pack', price: 18500 },
  { name: 'Dispenser Sabun Cair Wall Mounted 500ml Krisbow', cat: 'NON_MEDIS', unit: 'Pcs', price: 85000 },
  { name: 'Dispenser Tissue Hand Towel Interfold Wall Mounted', cat: 'NON_MEDIS', unit: 'Pcs', price: 125000 },
  { name: 'Jam Dinding Rumah Sakit Seiko Quiet Sweep 35cm', cat: 'NON_MEDIS', unit: 'Pcs', price: 280000 },
  { name: 'APAR Powder 3kg Yamato Alat Pemadam Api Ringan', cat: 'NON_MEDIS', unit: 'Unit', price: 480000 },
  { name: 'Refill APAR Powder 5kg Sertifikat Pemadam', cat: 'NON_MEDIS', unit: 'Tabung', price: 240000 }
];

async function seed200GeneralItems() {
  try {
    console.log(`🚀 Generating 200 General Warehouse Items (Gudang Umum)...`);
    const compiledGeneralItems = [];
    const batch = writeBatch(db);

    GENERAL_ITEMS_RAW.forEach((raw, idx) => {
      const num = String(idx + 201).padStart(3, '0');
      const itemCode = `UMUM-${raw.name.substring(0, 3).toUpperCase()}-${num}`;
      const depoTarget = DEPOS[idx % DEPOS.length];
      const stock = 15 + Math.floor(Math.random() * 250);
      const minStk = 10;
      const maxStk = 400;
      const isLow = stock <= minStk;

      const itemObj = {
        id: `item-${num}`,
        code: itemCode,
        name: raw.name,
        category: 'NON_MEDIS',
        depo: depoTarget,
        warehouse: `Gudang Umum`,
        shelf: `RAK-UMUM-${String.fromCharCode(65 + (idx % 6))}${String((idx % 10) + 1).padStart(2, '0')}`,
        batchNo: `UM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        expiredDate: '2029-12-31',
        stockQty: stock,
        unit: raw.unit,
        minStock: minStk,
        maxStock: maxStk,
        unitPrice: raw.price,
        status: isLow ? 'LOW_STOCK' : 'NORMAL',
        created_at: new Date().toISOString()
      };

      compiledGeneralItems.push(itemObj);

      const docRef = doc(db, 'inventory_items', `item-${num}`);
      batch.set(docRef, itemObj);
    });

    await batch.commit();
    console.log(`✅ Successfully seeded 200 General Items into Firestore collection 'inventory_items'!`);

    // UPDATE enterpriseInventory.service.js FILE BY APPENDING 200 GENERAL ITEMS
    const serviceFilePath = path.resolve('src/modules/inventory/services/enterpriseInventory.service.js');
    let serviceContent = fs.readFileSync(serviceFilePath, 'utf-8');

    // Read existing items from DEMO_DEPO_ITEMS in file or merge
    const regex = /export const DEMO_DEPO_ITEMS = (\[[\s\S]*?\n\]);/;
    const match = serviceContent.match(regex);
    let existingItems = [];

    if (match && match[1]) {
      try {
        existingItems = JSON.parse(match[1]);
      } catch (e) {
        console.warn('Could not parse existing DEMO_DEPO_ITEMS, using new set.');
      }
    }

    const mergedItems = [...existingItems, ...compiledGeneralItems];
    const formattedJS = JSON.stringify(mergedItems, null, 2);
    const replacement = `export const DEMO_DEPO_ITEMS = ${formattedJS};`;

    if (regex.test(serviceContent)) {
      serviceContent = serviceContent.replace(regex, replacement);
      fs.writeFileSync(serviceFilePath, serviceContent, 'utf-8');
      console.log(`✅ Successfully updated enterpriseInventory.service.js with Total ${mergedItems.length} items (200 Medical + 200 General)!`);
    }

  } catch (err) {
    console.error('❌ Error seeding 200 general inventory items:', err);
  }
}

seed200GeneralItems();
