import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
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

// CATEGORIES & DEPOS
const DEPOS = ['DEPO_IGD', 'DEPO_OK', 'DEPO_RAWAT_INAP', 'DEPO_FARMASI_CENTRAL', 'DEPO_POLIKLINIK', 'DEPO_LABORATORIUM'];
const UNITS = {
  OBAT: ['Tablet', 'Capsul', 'Vial', 'Ampul', 'Sirup Botol', 'Salep Tube', 'Infus Botol', 'Suppositoria', 'Inhaler'],
  BMHP: ['Pcs', 'Pasang', 'Roll', 'Botol', 'Box', 'Set', 'Fr', 'Pouch', 'Tube']
};

// 200 REALISTIC MEDICINES & MEDICAL SUPPLIES MASTER LIST
const INVENTORY_RAW_LIST = [
  // 1-30: ANALGESIK & ANTIINFLAMASI
  { name: 'Paracetamol 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1200 },
  { name: 'Paracetamol Syrup 120mg/5ml Botol 60ml', cat: 'OBAT', unit: 'Sirup Botol', price: 15000 },
  { name: 'Paracetamol Infus 1000mg/100ml Botol', cat: 'OBAT', unit: 'Infus Botol', price: 45000 },
  { name: 'Ibuprofen 400mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1800 },
  { name: 'Asam Mefenamat 500mg Kaplet', cat: 'OBAT', unit: 'Tablet', price: 2000 },
  { name: 'Ketorolac Injection 30mg/ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 18500 },
  { name: 'Tramadol 50mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 3500 },
  { name: 'Tramadol Injection 100mg/2ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 22000 },
  { name: 'Morphine Sulfate Inj 10mg/ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 85000 },
  { name: 'Fentanyl Injection 0.05mg/ml Ampul 2ml', cat: 'OBAT', unit: 'Ampul', price: 95000 },
  { name: 'Meloxicam 15mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2500 },
  { name: 'Natrium Diklofenak 50mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1500 },
  { name: 'Celecoxib 200mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 8500 },
  { name: 'Pethidine HCL Inj 50mg/ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 78000 },
  { name: 'Dexamethasone 0.5mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 800 },
  { name: 'Dexamethasone Inj 5mg/ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 8500 },
  { name: 'Methylprednisolone 4mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2200 },
  { name: 'Methylprednisolone 16mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 6500 },
  { name: 'Methylprednisolone Inj 125mg Vial', cat: 'OBAT', unit: 'Vial', price: 65000 },
  { name: 'Prednisone 5mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 900 },

  // 31-60: ANTIBIOTIK & ANTIJAMUR
  { name: 'Amoxicillin 500mg Kaplet', cat: 'OBAT', unit: 'Tablet', price: 2500 },
  { name: 'Amoxicillin Syrup Dry 125mg/5ml Botol', cat: 'OBAT', unit: 'Sirup Botol', price: 18000 },
  { name: 'Ampicillin Inj 1gr Vial', cat: 'OBAT', unit: 'Vial', price: 28000 },
  { name: 'Ampicillin Sulbactam Inj 1.5gr Vial', cat: 'OBAT', unit: 'Vial', price: 75000 },
  { name: 'Ceftriaxone Inj 1gr Vial (Phapros)', cat: 'OBAT', unit: 'Vial', price: 45000 },
  { name: 'Cefotaxime Inj 1gr Vial', cat: 'OBAT', unit: 'Vial', price: 42000 },
  { name: 'Cefixime 200mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 7500 },
  { name: 'Cefadroxil 500mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 4500 },
  { name: 'Azithromycin 500mg Kaplet', cat: 'OBAT', unit: 'Tablet', price: 14500 },
  { name: 'Erythromycin 500mg Kaplet', cat: 'OBAT', unit: 'Tablet', price: 5500 },
  { name: 'Levofloxacin 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 9500 },
  { name: 'Levofloxacin Infus 500mg/100ml Botol', cat: 'OBAT', unit: 'Infus Botol', price: 110000 },
  { name: 'Ciprofloxacin 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 3800 },
  { name: 'Ciprofloxacin Infus 200mg/100ml Botol', cat: 'OBAT', unit: 'Infus Botol', price: 85000 },
  { name: 'Meropenem Inj 1gr Vial', cat: 'OBAT', unit: 'Vial', price: 180000 },
  { name: 'Metronidazole 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2200 },
  { name: 'Metronidazole Infus 500mg/100ml Botol', cat: 'OBAT', unit: 'Infus Botol', price: 38000 },
  { name: 'Fluconazole 150mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 28000 },
  { name: 'Nystatin Oral Drop 100.000 IU Botol 12ml', cat: 'OBAT', unit: 'Sirup Botol', price: 42000 },
  { name: 'Gentamicin Inj 80mg/2ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 14000 },
  { name: 'Gentamicin Salep Mata 0.3% Tube', cat: 'OBAT', unit: 'Salep Tube', price: 16500 },
  { name: 'Vancomycin Inj 500mg Vial', cat: 'OBAT', unit: 'Vial', price: 210000 },
  { name: 'Cotrimoxazole 480mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1500 },
  { name: 'Chloramphenicol 250mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 2800 },
  { name: 'Doxycycline 100mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 3200 },
  { name: 'Clindamycin 300mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 6800 },
  { name: 'Acyclovir 400mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2400 },
  { name: 'Acyclovir Salep 5% Tube 5gr', cat: 'OBAT', unit: 'Salep Tube', price: 12500 },
  { name: 'Albendazole 400mg Tablet Kunyah', cat: 'OBAT', unit: 'Tablet', price: 3500 },
  { name: 'Mebendazole 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 4000 },

  // 61-90: KARDIOVASKULAR, HIPERTENSI & KOAGULASI
  { name: 'Amlodipine 5mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1000 },
  { name: 'Amlodipine 10mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1800 },
  { name: 'Captopril 25mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 800 },
  { name: 'Lisinopril 10mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2200 },
  { name: 'Candesartan 8mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 6500 },
  { name: 'Candesartan 16mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 11000 },
  { name: 'Valsartan 80mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 8500 },
  { name: 'Bisoprolol 5mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 3200 },
  { name: 'Propranolol 10mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 900 },
  { name: 'Furosemide 40mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1100 },
  { name: 'Furosemide Inj 20mg/2ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 8500 },
  { name: 'Spironolactone 25mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2800 },
  { name: 'Simvastatin 20mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2100 },
  { name: 'Atorvastatin 20mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 8900 },
  { name: 'Clopidogrel 75mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 7800 },
  { name: 'Aspilets / Aspirin 80mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1200 },
  { name: 'Heparin Sodium Inj 5000 IU/ml Vial 5ml', cat: 'OBAT', unit: 'Vial', price: 145000 },
  { name: 'Warfarin Sodium 2mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 4500 },
  { name: 'Isosorbide Dinitrate (ISDN) 5mg Sublingual', cat: 'OBAT', unit: 'Tablet', price: 1400 },
  { name: 'Digoxin 0.25mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1600 },
  { name: 'Dobutamine Inj 250mg/5ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 120000 },
  { name: 'Dopamine Inj 200mg/5ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 98000 },
  { name: 'Epinephrine Inj 1mg/ml (Adrenalin) Ampul', cat: 'OBAT', unit: 'Ampul', price: 16500 },
  { name: 'Norepinephrine Inj 4mg/4ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 135000 },
  { name: 'Nicardipine Inj 10mg/10ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 160000 },
  { name: 'Asam Traneksamat 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 4200 },
  { name: 'Asam Traneksamat Inj 500mg/5ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 19500 },
  { name: 'Vitamin K1 Inj 10mg/ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 12500 },

  // 91-120: GASTROINTESTINAL, MAAG & DIABETES
  { name: 'Omeprazole 20mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 2200 },
  { name: 'Omeprazole Inj 40mg Vial', cat: 'OBAT', unit: 'Vial', price: 48000 },
  { name: 'Lansoprazole 30mg Kapsul', cat: 'OBAT', unit: 'Capsul', price: 3800 },
  { name: 'Pantoprazole Inj 40mg Vial', cat: 'OBAT', unit: 'Vial', price: 62000 },
  { name: 'Ranitidine 150mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1400 },
  { name: 'Ranitidine Inj 50mg/2ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 7500 },
  { name: 'Sucralfate Syrup 500mg/5ml Botol 100ml', cat: 'OBAT', unit: 'Sirup Botol', price: 32000 },
  { name: 'Antasida DOEN Tablet Kunyah', cat: 'OBAT', unit: 'Tablet', price: 800 },
  { name: 'Domperidone 10mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1500 },
  { name: 'Domperidone Syrup 5mg/5ml Botol', cat: 'OBAT', unit: 'Sirup Botol', price: 19000 },
  { name: 'Ondansetron 4mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 3500 },
  { name: 'Ondansetron Inj 4mg/2ml Ampul', cat: 'OBAT', unit: 'Ampul', price: 16500 },
  { name: 'Metoclopramide 10mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 900 },
  { name: 'Loperamide 2mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1200 },
  { name: 'Attapulgite 600mg Tablet (New Diatabs)', cat: 'OBAT', unit: 'Tablet', price: 1800 },
  { name: 'Lactulose Syrup 3.33g/5ml Botol 120ml', cat: 'OBAT', unit: 'Sirup Botol', price: 48000 },
  { name: 'Bisacodyl Suppositoria 10mg Dulcolax Adult', cat: 'OBAT', unit: 'Suppositoria', price: 18500 },
  { name: 'Hyoscine N-Butylbromide 10mg (Buscopan)', cat: 'OBAT', unit: 'Tablet', price: 4500 },
  { name: 'Metformin 500mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 1200 },
  { name: 'Metformin 850mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2100 },
  { name: 'Glibenclamide 5mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 900 },
  { name: 'Glimepiride 2mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 2800 },
  { name: 'Glimepiride 4mg Tablet', cat: 'OBAT', unit: 'Tablet', price: 5400 },
  { name: 'Insulin Rapid Acting Novorapid Flexpen 3ml', cat: 'OBAT', unit: 'Pcs', price: 185000 },
  { name: 'Insulin Basal Lantus SoloSTAR Pen 3ml', cat: 'OBAT', unit: 'Pcs', price: 210000 },

  // 121-150: ALKES - CAIRAN INFUS & IV CATHETER
  { name: 'IV Catheter 18G Green (Terumo)', cat: 'BMHP', unit: 'Pcs', price: 18500 },
  { name: 'IV Catheter 20G Pink (Terumo)', cat: 'BMHP', unit: 'Pcs', price: 18500 },
  { name: 'IV Catheter 22G Blue (Terumo)', cat: 'BMHP', unit: 'Pcs', price: 18500 },
  { name: 'IV Catheter 24G Yellow (Terumo)', cat: 'BMHP', unit: 'Pcs', price: 19500 },
  { name: 'IV Catheter 26G Violet (Terumo Pediatric)', cat: 'BMHP', unit: 'Pcs', price: 22000 },
  { name: 'Infus Set Dewasa Macro Drip (Otsuka)', cat: 'BMHP', unit: 'Pcs', price: 14500 },
  { name: 'Infus Set Anak Micro Drip 60 Drops/ml', cat: 'BMHP', unit: 'Pcs', price: 16500 },
  { name: 'Blood Transfusion Set (Set Transfusi Darah)', cat: 'BMHP', unit: 'Pcs', price: 24500 },
  { name: 'Cairan Infus NaCl 0.9% 500ml (Otsuka)', cat: 'BMHP', unit: 'Botol', price: 24000 },
  { name: 'Cairan Infus Ringer Laktat (RL) 500ml', cat: 'BMHP', unit: 'Botol', price: 23500 },
  { name: 'Cairan Infus Dextrose 5% 500ml', cat: 'BMHP', unit: 'Botol', price: 23000 },
  { name: 'Cairan Infus Dextrose 10% 500ml', cat: 'BMHP', unit: 'Botol', price: 26000 },
  { name: 'Cairan Infus Asering 500ml (Otsuka)', cat: 'BMHP', unit: 'Botol', price: 34000 },
  { name: 'Cairan Infus Gelafundin / Gelatin 500ml', cat: 'BMHP', unit: 'Botol', price: 145000 },
  { name: 'Cairan Infus KA-EN 3B 500ml Pediatric', cat: 'BMHP', unit: 'Botol', price: 28500 },
  { name: 'Cairan Manitol 20% 500ml Botol', cat: 'BMHP', unit: 'Botol', price: 68000 },
  { name: 'Water For Injection (WIDA WI) 25ml Plastik', cat: 'BMHP', unit: 'Botol', price: 8500 },

  // 151-180: ALKES - SPUIT, KATETER, RESPIRASI & BANDAGE
  { name: 'Spuit 1cc Tuberculin BD Needle 26G', cat: 'BMHP', unit: 'Pcs', price: 3500 },
  { name: 'Spuit 3cc Terumo Needle 23G', cat: 'BMHP', unit: 'Pcs', price: 2800 },
  { name: 'Spuit 5cc Terumo Needle 22G', cat: 'BMHP', unit: 'Pcs', price: 3200 },
  { name: 'Spuit 10cc Terumo Needle 21G', cat: 'BMHP', unit: 'Pcs', price: 4500 },
  { name: 'Spuit 20cc Terumo Luer Lock', cat: 'BMHP', unit: 'Pcs', price: 9500 },
  { name: 'Spuit 50cc Perfusor Syringe Pump Terumo', cat: 'BMHP', unit: 'Pcs', price: 24000 },
  { name: 'Foley Catheter 2-Way Size 14Fr Rusch Gold', cat: 'BMHP', unit: 'Pcs', price: 32000 },
  { name: 'Foley Catheter 2-Way Size 16Fr Rusch Gold', cat: 'BMHP', unit: 'Pcs', price: 32000 },
  { name: 'Foley Catheter 2-Way Size 18Fr Rusch Gold', cat: 'BMHP', unit: 'Pcs', price: 32000 },
  { name: 'Urine Bag 2000ml Steril dengan T-Valve', cat: 'BMHP', unit: 'Pcs', price: 14500 },
  { name: 'NGT (Nasogastric Tube) Silicon Size 14Fr', cat: 'BMHP', unit: 'Pcs', price: 45000 },
  { name: 'NGT (Nasogastric Tube) Silicon Size 16Fr', cat: 'BMHP', unit: 'Pcs', price: 45000 },
  { name: 'Nasal Cannula Oksigen Dewasa High Flow', cat: 'BMHP', unit: 'Pcs', price: 12500 },
  { name: 'Nasal Cannula Oksigen Anak / Pediatric', cat: 'BMHP', unit: 'Pcs', price: 13500 },
  { name: 'Masker Oksigen Non-Rebreathing (NRM) Adult', cat: 'BMHP', unit: 'Pcs', price: 35000 },
  { name: 'Endotracheal Tube (ETT) Cuffed Size 7.0', cat: 'BMHP', unit: 'Pcs', price: 55000 },
  { name: 'Endotracheal Tube (ETT) Cuffed Size 7.5', cat: 'BMHP', unit: 'Pcs', price: 55000 },
  { name: 'Endotracheal Tube (ETT) Cuffed Size 8.0', cat: 'BMHP', unit: 'Pcs', price: 55000 },
  { name: 'Verband Gulung 5cm x 4 yard Box 10 Roll', cat: 'BMHP', unit: 'Roll', price: 4500 },
  { name: 'Verband Gulung 10cm x 4 yard Box 10 Roll', cat: 'BMHP', unit: 'Roll', price: 8500 },
  { name: 'Kasa Steril Husada 16x16 cm Box 10 Pouch', cat: 'BMHP', unit: 'Box', price: 28000 },
  { name: 'Alcohol Swab 70% Isopropyl Box 100 Pcs', cat: 'BMHP', unit: 'Box', price: 24000 },
  { name: 'Povidone Iodine 10% Betadine Botol 1 Liter', cat: 'BMHP', unit: 'Botol', price: 145000 },
  { name: 'Underpad Disposable Sensipad Size 60x90cm', cat: 'BMHP', unit: 'Pcs', price: 6500 },

  // 181-200: ALKES - BEDAH, SARUNG TANGAN, MASKER & ELEKTRODA
  { name: 'Sarung Tangan Steril Surgicare Size 6.5', cat: 'BMHP', unit: 'Pasang', price: 9500 },
  { name: 'Sarung Tangan Steril Surgicare Size 7.0', cat: 'BMHP', unit: 'Pasang', price: 9500 },
  { name: 'Sarung Tangan Steril Surgicare Size 7.5', cat: 'BMHP', unit: 'Pasang', price: 9500 },
  { name: 'Sarung Tangan Non-Steril Latex Size M Box 100', cat: 'BMHP', unit: 'Box', price: 65000 },
  { name: 'Sarung Tangan Nitrile Non-Powder Size M Box 100', cat: 'BMHP', unit: 'Box', price: 78000 },
  { name: 'Masker Bedah 3-Ply Earloop Box 50 Pcs', cat: 'BMHP', unit: 'Box', price: 25000 },
  { name: 'Masker Respirator N95 3M 8210 Box 20 Pcs', cat: 'BMHP', unit: 'Box', price: 280000 },
  { name: 'Apron Plastik Disposable Steril Pack 50', cat: 'BMHP', unit: 'Pack', price: 45000 },
  { name: 'Cap Hairnet Nursecap Disposable Box 100', cat: 'BMHP', unit: 'Box', price: 32000 },
  { name: 'Benang Bedah Chromic Catgut 2/0 Jarum HR37', cat: 'BMHP', unit: 'Pcs', price: 48000 },
  { name: 'Benang Bedah Silk 3/0 Cutting Needle DS24', cat: 'BMHP', unit: 'Pcs', price: 38000 },
  { name: 'Benang Bedah Vicryl 3/0 Ethicon Polyglactin', cat: 'BMHP', unit: 'Pcs', price: 95000 },
  { name: 'Bisturi / Surgical Blade Bedah Size 11 Box 100', cat: 'BMHP', unit: 'Box', price: 120000 },
  { name: 'Bisturi / Surgical Blade Bedah Size 15 Box 100', cat: 'BMHP', unit: 'Box', price: 120000 },
  { name: 'Hypafix Plaster 5cm x 5m Roll', cat: 'BMHP', unit: 'Roll', price: 58000 },
  { name: 'Hypafix Plaster 10cm x 5m Roll', cat: 'BMHP', unit: 'Roll', price: 105000 },
  { name: 'Micropore 1 Inchi x 10 yard 3M Roll', cat: 'BMHP', unit: 'Roll', price: 28000 },
  { name: 'Electrodes ECG Monitoring Adult Pack 50', cat: 'BMHP', unit: 'Pack', price: 65000 },
  { name: 'Gel ECG / Gel USG Aquasonic 250ml Botol', cat: 'BMHP', unit: 'Botol', price: 35000 },
  { name: 'Kertas Thermal EKG 3-Channel Roll 60mmx30m', cat: 'BMHP', unit: 'Roll', price: 25000 }
];

async function seed200Items() {
  try {
    console.log(`🚀 Generating 200 Enterprise Inventory Items...`);
    const compiledDemoItems = [];

    const batch = writeBatch(db);

    INVENTORY_RAW_LIST.forEach((raw, idx) => {
      const num = String(idx + 1).padStart(3, '0');
      const itemCode = `${raw.cat}-${raw.name.substring(0, 3).toUpperCase()}-${num}`;
      const depoTarget = DEPOS[idx % DEPOS.length];
      const stock = 20 + Math.floor(Math.random() * 300);
      const minStk = 15;
      const maxStk = 500;
      const isLow = stock <= minStk;

      const itemObj = {
        id: `item-${num}`,
        code: itemCode,
        name: raw.name,
        category: raw.cat,
        depo: depoTarget,
        batchNo: `BTC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        expiredDate: `2027-${String((idx % 12) + 1).padStart(2, '0')}-15`,
        stockQty: stock,
        unit: raw.unit,
        minStock: minStk,
        maxStock: maxStk,
        unitPrice: raw.price,
        status: isLow ? 'LOW_STOCK' : 'NORMAL',
        created_at: new Date().toISOString()
      };

      compiledDemoItems.push(itemObj);

      // Write to Firestore inventory_items collection
      const docRef = doc(db, 'inventory_items', `item-${num}`);
      batch.set(docRef, itemObj);
    });

    await batch.commit();
    console.log(`✅ Successfully seeded 200 items into Firestore collection 'inventory_items'!`);

    // UPDATE enterpriseInventory.service.js FILE WITH 200 ITEMS
    const serviceFilePath = path.resolve('src/modules/inventory/services/enterpriseInventory.service.js');
    let serviceContent = fs.readFileSync(serviceFilePath, 'utf-8');

    const formattedJS = JSON.stringify(compiledDemoItems, null, 2);
    const replacement = `export const DEMO_DEPO_ITEMS = ${formattedJS};`;

    const regex = /export const DEMO_DEPO_ITEMS = \[\s*[\s\S]*?\n\];/;
    if (regex.test(serviceContent)) {
      serviceContent = serviceContent.replace(regex, replacement);
      fs.writeFileSync(serviceFilePath, serviceContent, 'utf-8');
      console.log(`✅ Successfully updated enterpriseInventory.service.js with 200 static demo items!`);
    } else {
      console.warn(`⚠️ Could not regex match DEMO_DEPO_ITEMS in enterpriseInventory.service.js`);
    }

  } catch (err) {
    console.error('❌ Error seeding 200 inventory items:', err);
  }
}

seed200Items();
