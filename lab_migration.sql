-- ============================================================================
-- Laboratory Enhancement Migration
-- Creates lab_test_catalog, lab_test_supplies, and extends lab_orders/results.
-- Idempotent: safe to re-run.
-- ============================================================================

-- Base tables (in case they don't exist yet)
CREATE TABLE IF NOT EXISTS lab_orders (
  id BIGSERIAL PRIMARY KEY,
  patient_mrn TEXT NOT NULL DEFAULT '',
  patient_name TEXT NOT NULL DEFAULT '',
  tests TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id BIGSERIAL PRIMARY KEY,
  patient_mrn TEXT NOT NULL DEFAULT '',
  patient_name TEXT NOT NULL DEFAULT '',
  test TEXT NOT NULL DEFAULT '',
  value TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  range TEXT DEFAULT '',
  status TEXT DEFAULT 'Normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend lab_orders
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS ordered_by TEXT DEFAULT '';
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS result_status TEXT DEFAULT 'Scheduled';
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';

-- Extend lab_results
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS lab_order_id BIGINT REFERENCES lab_orders(id) ON DELETE SET NULL;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS completed_by TEXT DEFAULT '';
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_lab_orders_result_status ON lab_orders(result_status);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results(lab_order_id);

-- ============================================================================
-- Lab Test Catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_test_catalog (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  specialty TEXT NOT NULL,
  description TEXT DEFAULT '',
  required_equipment TEXT[] DEFAULT '{}',
  normal_range TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_catalog_category ON lab_test_catalog(category);
CREATE INDEX IF NOT EXISTS idx_lab_catalog_specialty ON lab_test_catalog(specialty);

ALTER TABLE lab_test_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_lab_catalog" ON lab_test_catalog;
CREATE POLICY "allow_all_lab_catalog" ON lab_test_catalog FOR ALL USING (true) WITH CHECK (true);

-- Lab Test Supplies (links tests to pharmacy drugs)
CREATE TABLE IF NOT EXISTS lab_test_supplies (
  id BIGSERIAL PRIMARY KEY,
  lab_test_catalog_id BIGINT REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
  drug_name TEXT NOT NULL DEFAULT '',
  drug_id BIGINT REFERENCES drugs(id) ON DELETE SET NULL,
  quantity_needed NUMERIC DEFAULT 1,
  supply_unit TEXT DEFAULT 'unit'
);

ALTER TABLE lab_test_supplies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_lab_supplies" ON lab_test_supplies;
CREATE POLICY "allow_all_lab_supplies" ON lab_test_supplies FOR ALL USING (true) WITH CHECK (true);

-- RLS for extended tables
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_lab_orders" ON lab_orders;
CREATE POLICY "allow_all_lab_orders" ON lab_orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_lab_results" ON lab_results;
CREATE POLICY "allow_all_lab_results" ON lab_results FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Seed: Lab Test Catalog (~70 tests)
-- ============================================================================
INSERT INTO lab_test_catalog (name, category, specialty, description, required_equipment, normal_range, unit, duration_minutes)
SELECT v.name, v.category, v.specialty, v.description, v.required_equipment::TEXT[], v.normal_range, v.unit, v.duration_minutes
FROM (VALUES
  -- HEMATOLOGY
  ('Complete Blood Count (CBC)',       'Hematology', 'Hematology',        'Full blood panel including RBC, WBC, Hgb, Hct, Platelets', '{"Hematology analyzer","EDTA tubes","Microscope"}',       'WBC: 4.5–11.0, RBC: 4.5–5.5, Hgb: 12–17, Hct: 36–52, Plt: 150–400', 'various', 30),
  ('Blood Smear / Peripheral Film',    'Hematology', 'Hematology',        'Morphological evaluation of blood cells under microscope', '{"Microscope","Glass slides","Wright stain"}',             'Normal morphology',                                                   '',       45),
  ('ESR (Erythrocyte Sedimentation)',  'Hematology', 'Hematology',        'Measures rate of red blood cell settling',                 '{"ESR tubes","Westergren rack"}',                         'Male: <15 mm/hr, Female: <20 mm/hr',                                  'mm/hr',  60),
  ('Prothrombin Time (PT/INR)',        'Hematology', 'Hematology',        'Coagulation pathway assessment',                           '{"Coagulation analyzer","Citrate tubes"}',                'PT: 11–13.5 sec, INR: 0.8–1.2',                                       'sec',    30),
  ('APTT (Partial Thromboplastin)',    'Hematology', 'Hematology',        'Intrinsic coagulation pathway test',                       '{"Coagulation analyzer","Citrate tubes"}',                '25–35 sec',                                                           'sec',    30),
  ('Blood Group & Cross-match',        'Hematology', 'Hematology',        'ABO/Rh blood typing and compatibility testing',            '{"Blood bank equipment","Antisera kits","Centrifuge"}',   'A/B/AB/O, Rh+/-',                                                     '',       45),
  -- CLINICAL CHEMISTRY
  ('Fasting Blood Glucose (FBG)',      'Clinical Chemistry', 'Internal Medicine', 'Blood sugar level after 8-hour fast',               '{"Glucometer","Chemistry analyzer","Fluoride tube"}',     '70–99',                                                               'mg/dL',  15),
  ('HbA1c (Glycated Hemoglobin)',      'Clinical Chemistry', 'Endocrinology',     '3-month average blood glucose marker',              '{"HPLC analyzer","EDTA tube"}',                           '< 5.7%',                                                              '%',      20),
  ('Liver Function Tests (LFT)',       'Clinical Chemistry', 'Gastroenterology',  'ALT, AST, ALP, GGT, Bilirubin, Total Protein',     '{"Chemistry analyzer","Gel tube"}',                       'ALT: 7–56 U/L, AST: 10–40 U/L, Bilirubin: 0.2–1.2 mg/dL',           'U/L',    30),
  ('Renal Function Tests (RFT)',       'Clinical Chemistry', 'Nephrology',        'Creatinine, BUN, eGFR, Uric Acid',                 '{"Chemistry analyzer","Gel tube"}',                       'Creatinine: 0.6–1.2 mg/dL, BUN: 7–25 mg/dL',                         'mg/dL',  30),
  ('Lipid Panel',                      'Clinical Chemistry', 'Cardiology',        'Total Cholesterol, LDL, HDL, Triglycerides',        '{"Chemistry analyzer","Gel tube"}',                       'Total Chol: <200, LDL: <100, HDL: >40, TG: <150',                     'mg/dL',  30),
  ('Electrolytes (Na/K/Cl/HCO3)',      'Clinical Chemistry', 'Internal Medicine', 'Serum electrolyte panel',                          '{"Electrolyte analyzer","Gel tube"}',                     'Na: 136–145, K: 3.5–5.1, Cl: 98–107, HCO3: 22–29',                   'mEq/L',  20),
  ('C-Reactive Protein (CRP)',         'Clinical Chemistry', 'Internal Medicine', 'Acute-phase inflammatory marker',                  '{"Chemistry analyzer","CRP kit"}',                        '< 5.0',                                                               'mg/L',   20),
  ('Serum Calcium',                    'Clinical Chemistry', 'Internal Medicine', 'Total serum calcium level',                        '{"Chemistry analyzer","Gel tube"}',                       '8.5–10.5',                                                            'mg/dL',  20),
  ('Uric Acid',                        'Clinical Chemistry', 'Rheumatology',      'Serum uric acid for gout assessment',              '{"Chemistry analyzer","Gel tube"}',                       'Male: 3.5–7.2, Female: 2.6–6.0',                                      'mg/dL',  20),
  ('Total Protein & Albumin',          'Clinical Chemistry', 'Internal Medicine', 'Nutritional and liver function markers',           '{"Chemistry analyzer","Gel tube"}',                       'Total Protein: 6.3–8.2, Albumin: 3.5–5.0',                           'g/dL',   20),
  ('Iron Studies (Fe/TIBC/Ferritin)',  'Clinical Chemistry', 'Hematology',        'Iron deficiency and overload assessment',          '{"Chemistry analyzer","Gel tube"}',                       'Ferritin: Male 24–336, Female 11–307',                                'ng/mL',  30),
  -- MICROBIOLOGY
  ('Blood Culture & Sensitivity',      'Microbiology', 'Infectious Disease', 'Identifies bacteria/fungi in bloodstream',        '{"Blood culture bottles","Incubator","Biosafety cabinet"}', 'No growth',                                                          '',       72*60),
  ('Urine Culture & Sensitivity',      'Microbiology', 'Nephrology',         'Identifies UTI pathogens and sensitivities',       '{"Culture plates","Incubator","Urine container"}',          '< 10^5 CFU/mL',                                                      'CFU/mL', 48*60),
  ('Stool Culture & Sensitivity',      'Microbiology', 'Gastroenterology',   'Identifies enteric pathogens',                    '{"Culture plates","Incubator","Stool container"}',          'No pathogen isolated',                                               '',       48*60),
  ('Sputum Culture & AFB',             'Microbiology', 'Pulmonology',        'TB screening and respiratory pathogen culture',   '{"Culture plates","Incubator","Ziehl-Neelsen stain"}',      'No AFB seen',                                                        '',       48*60),
  ('Wound Swab Culture',               'Microbiology', 'Surgery',            'Wound infection pathogen identification',          '{"Swab kits","Culture plates","Incubator"}',                'No significant growth',                                              '',       48*60),
  ('Throat Swab Culture',              'Microbiology', 'ENT',                'Identifies pharyngeal pathogens',                 '{"Swab kits","Culture plates","Incubator"}',                'No significant growth',                                              '',       24*60),
  ('Malaria RDT',                      'Microbiology', 'Infectious Disease', 'Rapid malaria antigen detection',                 '{"Malaria RDT kit","Lancet","Blood collection tube"}',      'Negative',                                                           '',       30),
  ('Stool Ova & Parasites (O&P)',      'Microbiology', 'Gastroenterology',   'Intestinal parasite and egg detection',           '{"Microscope","Stool container","Lugol iodine"}',            'No ova or parasites seen',                                           '',       60),
  -- IMMUNOLOGY & SEROLOGY
  ('HIV 1/2 Antibody Test',            'Immunology', 'Infectious Disease', 'Rapid HIV antibody screening',                     '{"HIV rapid test kit","Lancet"}',                            'Non-reactive',                                                       '',       30),
  ('Hepatitis B Antigen (HBsAg)',      'Immunology', 'Gastroenterology',   'Hepatitis B surface antigen detection',            '{"HBsAg rapid test kit"}',                                  'Negative',                                                           '',       30),
  ('Hepatitis C Antibody (Anti-HCV)', 'Immunology', 'Gastroenterology',   'Hepatitis C antibody screening',                   '{"Anti-HCV rapid test kit"}',                               'Non-reactive',                                                       '',       30),
  ('Syphilis RPR/VDRL',               'Immunology', 'Infectious Disease', 'Syphilis non-treponemal antibody test',             '{"RPR card test kit","Rotator"}',                            'Non-reactive',                                                       '',       30),
  ('Widal Test (Typhoid)',             'Immunology', 'Infectious Disease', 'Enteric fever antibody titers',                    '{"Widal antigen set","Test tubes"}',                         'Negative at 1:40 dilution',                                          '',       60),
  ('ANA (Antinuclear Antibody)',       'Immunology', 'Rheumatology',       'Autoimmune disease screening marker',              '{"ANA ELISA kit","Microplate reader"}',                      'Negative (< 1:40)',                                                  '',       60),
  ('Anti-dsDNA Antibody',             'Immunology', 'Rheumatology',       'Lupus-specific autoantibody',                      '{"Anti-dsDNA ELISA kit","Microplate reader"}',               '< 10 IU/mL',                                                         'IU/mL',  60),
  -- CARDIOLOGY
  ('12-Lead ECG / EKG',               'Cardiology', 'Cardiology', 'Electrocardiogram for cardiac rhythm assessment', '{"ECG machine","Electrodes","Conductive gel"}',           'Normal sinus rhythm',                                                '',       15),
  ('Troponin I (Cardiac)',            'Cardiology', 'Cardiology', 'Cardiac muscle injury biomarker',                 '{"Troponin rapid kit","Immunoassay analyzer"}',           '< 0.04',                                                             'ng/mL',  30),
  ('CK-MB (Creatine Kinase MB)',      'Cardiology', 'Cardiology', 'Myocardial infarction biomarker',                 '{"Chemistry analyzer","Gel tube"}',                       'Male: 0–3.6, Female: 0–3.6',                                         'ng/mL',  30),
  ('BNP / NT-proBNP',                'Cardiology', 'Cardiology', 'Heart failure biomarker',                         '{"BNP ELISA kit","Immunoassay analyzer"}',                'BNP < 100',                                                          'pg/mL',  30),
  ('Echocardiography (Echo)',         'Cardiology', 'Cardiology', 'Cardiac ultrasound structural assessment',        '{"Ultrasound machine","Echo probe","Gel"}',               'Normal cardiac structure and function',                              '',       45),
  ('Holter Monitor (24-Hour)',        'Cardiology', 'Cardiology', '24-hour continuous ECG monitoring',              '{"Holter device","Electrodes"}',                          'Normal sinus rhythm, no arrhythmia',                                 '',       1440),
  -- RADIOLOGY & IMAGING
  ('Chest X-Ray (CXR)',              'Radiology', 'Radiology',   'Anterior-posterior chest radiograph',             '{"X-ray machine","Lead aprons","X-ray film/digital"}',   'Clear lung fields, normal heart size',                               '',       15),
  ('Abdominal Ultrasound',           'Radiology', 'Radiology',   'Sonographic evaluation of abdominal organs',      '{"Ultrasound machine","Abdominal probe","Gel"}',          'Normal abdominal organ morphology',                                  '',       30),
  ('Pelvic Ultrasound',              'Radiology', 'Radiology',   'Pelvic organ sonographic assessment',             '{"Ultrasound machine","Pelvic probe","Gel"}',             'Normal pelvic structures',                                           '',       30),
  ('Chest CT Scan',                  'Radiology', 'Radiology',   'Cross-sectional chest imaging',                   '{"CT scanner","Contrast media (optional)","IV line"}',   'No significant pulmonary abnormality',                               '',       30),
  ('Brain CT Scan',                  'Radiology', 'Neurology',   'Cranial CT for intracranial pathology',           '{"CT scanner","Contrast media (optional)"}',              'No intracranial hemorrhage or mass',                                 '',       30),
  ('Abdominal CT Scan',              'Radiology', 'Gastroenterology','CT abdomen with/without contrast',            '{"CT scanner","Contrast media","IV line"}',               'No significant abdominal pathology',                                 '',       30),
  ('MRI Brain',                      'Radiology', 'Neurology',   'High-resolution brain MRI',                       '{"MRI machine","Contrast media (optional)"}',             'Normal brain parenchyma',                                            '',       60),
  ('Bone Density Scan (DEXA)',        'Radiology', 'Orthopedics', 'Osteoporosis assessment scan',                    '{"DEXA scanner"}',                                        'T-score > -1.0',                                                     '',       30),
  -- URINALYSIS
  ('Complete Urinalysis (UA)',        'Urinalysis', 'Nephrology',    'Full urine physical/chemical/microscopic exam', '{"Urinalysis strips","Centrifuge","Microscope"}',          'pH 4.6–8.0, SG 1.005–1.030, Protein Neg, Glucose Neg',              '',       15),
  ('Urine Pregnancy Test (hCG)',     'Urinalysis', 'OB/GYN',        'Rapid urine human chorionic gonadotropin test', '{"hCG rapid test kit","Urine cup"}',                       'Negative',                                                           '',       5),
  ('Urine Drug Screen (10-Panel)',   'Urinalysis', 'Toxicology',    'Multi-drug urine screening',                    '{"Drug screen dipstick panel","Urine cup"}',               'Negative for all substances',                                        '',       15),
  ('24-Hour Urine Protein',          'Urinalysis', 'Nephrology',    'Quantitative protein excretion over 24 hours',  '{"24-hr urine container","Chemistry analyzer"}',           '< 150 mg/24hr',                                                      'mg/24hr',1440),
  -- DRUG REACTION & ALLERGY
  ('Penicillin Skin Test',           'Drug Reaction', 'Allergy & Immunology', 'IgE-mediated penicillin allergy testing', '{"Penicillin G 10,000 U/mL","Histamine control","Saline","Lancet"}', 'Negative wheal < 3mm', 'mm', 30),
  ('Drug Sensitivity Panel',         'Drug Reaction', 'Allergy & Immunology', 'Multi-drug intradermal sensitivity testing','{"Drug sensitivity kits","Syringes","Lancets"}',    'No significant reaction',                                            '',       60),
  ('Allergy Skin Prick Test (RAST)', 'Drug Reaction', 'Allergy & Immunology', 'Multi-allergen panel for food/environmental allergies','{"Allergen panel kit","Lancets","Ruler"}','No wheal > 3mm above negative control','mm',60),
  -- ENDOCRINOLOGY
  ('TSH (Thyroid Stimulating Hormone)','Endocrinology','Endocrinology','Pituitary TSH level for thyroid function',   '{"Immunoassay analyzer","Gel tube"}',                     '0.4–4.0',                                                            'mIU/L',  30),
  ('Free T4 (FT4)',                  'Endocrinology', 'Endocrinology', 'Free thyroxine for hypothyroid/hyperthyroid', '{"Immunoassay analyzer","Gel tube"}',                     '0.8–1.8',                                                            'ng/dL',  30),
  ('Free T3 (FT3)',                  'Endocrinology', 'Endocrinology', 'Free triiodothyronine assessment',           '{"Immunoassay analyzer","Gel tube"}',                     '2.3–4.1',                                                            'pg/mL',  30),
  ('Cortisol (AM)',                  'Endocrinology', 'Endocrinology', 'Morning cortisol for adrenal function',      '{"Immunoassay analyzer","Gel tube"}',                     '6.2–19.4',                                                           'μg/dL',  30),
  ('Testosterone (Total)',           'Endocrinology', 'Endocrinology', 'Total serum testosterone level',             '{"Immunoassay analyzer","Gel tube"}',                     'Male: 300–1000, Female: 15–70',                                      'ng/dL',  30),
  ('Fasting Insulin Level',          'Endocrinology', 'Endocrinology', 'Fasting insulin for insulin resistance',     '{"Immunoassay analyzer","Gel tube"}',                     '2.6–24.9',                                                           'μIU/mL', 30),
  -- NEUROLOGY
  ('EEG (Electroencephalogram)',     'Neurology', 'Neurology',    'Brain electrical activity recording',             '{"EEG machine","Electrodes","Conductive gel"}',           'Normal brain wave activity',                                         '',       60),
  ('Nerve Conduction Study (NCS)',   'Neurology', 'Neurology',    'Peripheral nerve conduction velocity',           '{"EMG/NCS machine","Surface electrodes"}',                'Normal NCV and latency',                                             '',       45),
  ('CSF Analysis (Lumbar Puncture)', 'Neurology', 'Neurology',    'Cerebrospinal fluid analysis for meningitis/MS', '{"LP kit","Manometer","Specimen tubes","Microscope"}',     'Clear, colorless; WBC <5/μL, Protein 15–45 mg/dL, Glucose 50–80 mg/dL','',60),
  -- GYNECOLOGY & OBSTETRICS
  ('Pap Smear / Cervical Cytology',  'Gynecology', 'OB/GYN', 'Cervical cancer screening',                         '{"Speculum","Cervical brush","Fixative spray","Slide"}',   'NILM (No Intraepithelial Lesion or Malignancy)',                      '',       15),
  ('Beta-hCG Quantitative',          'Gynecology', 'OB/GYN', 'Serum hCG for pregnancy confirmation & monitoring', '{"Immunoassay analyzer","Gel tube"}',                      'Non-pregnant: < 5',                                                  'mIU/mL', 30),
  ('Breast Ultrasound',              'Gynecology', 'OB/GYN', 'Breast tissue sonographic evaluation',               '{"Ultrasound machine","Linear probe","Gel"}',              'No suspicious lesion (BI-RADS 1)',                                   '',       30),
  -- PULMONOLOGY
  ('Spirometry / PFT',               'Pulmonology', 'Pulmonology', 'Lung function: FVC, FEV1, FEV1/FVC ratio',    '{"Spirometer","Disposable mouthpiece","Nose clip"}',       'FEV1/FVC > 0.7',                                                     '%',      30),
  ('Arterial Blood Gas (ABG)',       'Pulmonology', 'Pulmonology', 'Acid-base and oxygenation status',             '{"Heparinized ABG syringe","Blood gas analyzer","Ice"}',   'pH 7.35–7.45, pO2 80–100, pCO2 35–45, HCO3 22–26',                  '',       15),
  ('Peak Flow Measurement',          'Pulmonology', 'Pulmonology', 'Asthma monitoring and severity assessment',    '{"Peak flow meter","Disposable mouthpiece"}',              '> 80% predicted',                                                    'L/min',  5),
  -- OPHTHALMOLOGY
  ('Fundoscopy / Ophthalmoscopy',    'Ophthalmology', 'Ophthalmology', 'Retinal and optic disc examination',       '{"Ophthalmoscope","Mydriatic drops"}',                     'Normal optic disc and retina',                                       '',       15),
  ('Intraocular Pressure (IOP)',     'Ophthalmology', 'Ophthalmology', 'Glaucoma screening pressure measurement',  '{"Non-contact tonometer","Slit lamp"}',                    '10–21',                                                              'mmHg',   10),
  ('Visual Acuity Test',             'Ophthalmology', 'Ophthalmology', 'Near and distance vision assessment',      '{"Snellen chart","Pinhole occluder","Refraction kit"}',    '20/20 (6/6)',                                                         '',       10),
  -- PATHOLOGY
  ('Tissue Biopsy (Core/Fine Needle)','Pathology','Pathology','Histopathological tissue sampling and analysis',    '{"Biopsy needle","Formalin container","Microscope","Stains"}','No malignant cells identified',                                   '',       60),
  ('PAP Smear Cytology Reading',     'Pathology', 'Pathology', 'Microscopic cervical cytology interpretation',    '{"Microscope","Staining kit","Slides"}',                   'No abnormal cells',                                                  '',       1440)
) AS v(name, category, specialty, description, required_equipment, normal_range, unit, duration_minutes)
WHERE NOT EXISTS (SELECT 1 FROM lab_test_catalog WHERE lab_test_catalog.name = v.name);
