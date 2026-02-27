import { useState, useRef, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

/* ─── UPLOADED DOCUMENTS ─────────────────────────────────────────────────── */
const DOCUMENTS = [
  { name: "DOC1_Aircraft_Lease_Agreement.pdf",     type: "LEASE",     pages: 8,  size:"24 KB" },
  { name: "DOC2_Loan_Security_Agreement.pdf",      type: "LOAN",      pages: 5,  size:"16 KB" },
  { name: "DOC3_Insurance_Certificate_Pack.pdf",   type: "INSURANCE", pages: 6,  size:"18 KB" },
  { name: "DOC4_Maintenance_Reserve_Schedule.pdf", type: "MR",        pages: 4,  size:"13 KB" },
  { name: "DOC5_Aircraft_Utilisation_Report.pdf",  type: "UTIL",      pages: 5,  size:"17 KB" },
  { name: "DOC6A_Delivery_Condition_Report.pdf",   type: "DELIVERY",  pages: 8,  size:"27 KB" },
  { name: "DOC6B_Engine2_Shop_Visit_Report.pdf",   type: "SVR",       pages: 6,  size:"20 KB" },
  { name: "DOC6C_Legal_Opinion_Appleby.pdf",       type: "LEGAL",     pages: 5,  size:"16 KB" },
  { name: "SPV_Bank_Statement_FY2024.pdf",         type: "BANK",      pages: 15, size:"105 KB"},
  { name: "SPV_ARX_Audit_Workbook.xlsx",           type: "AUDIT",     pages: 8,  size:"142 KB"},
];

/* ─── LEASE AGREEMENT AUDIT QUESTIONS ────────────────────────────────────── */
const LEASE_QUESTIONS = [
  { section:"SECTION A — LESSOR & LESSEE IDENTIFICATION" },
  { ref:"L-01", q:"Is the Lessor correctly identified in the agreement?", expected:"Arx Aviation SPV III Ltd", actual:"Arx Aviation SPV III Ltd (Ireland)", source:"Lease Agmt. p.1", status:"PASS" },
  { ref:"L-02", q:"Is the Lessee legal entity name accurate and consistent?", expected:"Meridian Air LLC", actual:"Meridian Air LLC (Bermuda reg. no. 87234)", source:"Lease Agmt. p.1", status:"PASS" },
  { ref:"L-03", q:"Are Lessor and Lessee addresses correctly stated?", expected:"Match registered addresses", actual:"Both match IATA registry", source:"Lease Agmt. p.2", status:"PASS" },
  { ref:"L-04", q:"Has Lessee provided evidence of good standing / solvency?", expected:"Certificate < 6 months old", actual:"Issued 10 Jan 2025 (36 days)", source:"Lessee Good Standing Cert.", status:"PASS" },
  { ref:"L-05", q:"Is there a valid Power of Attorney on file for signatories?", expected:"Yes — current", actual:"POA dated 15 Mar 2022, valid until Mar 2027", source:"POA Document", status:"PASS" },
  { section:"SECTION B — AIRCRAFT DESCRIPTION & DELIVERY" },
  { ref:"L-06", q:"Does MSN match the lease schedule?", expected:"7845", actual:"7845", source:"Lease Schedule 1", status:"PASS" },
  { ref:"L-07", q:"Does aircraft registration match?", expected:"VQ-BXY", actual:"VQ-BXY", source:"Lease Schedule 1", status:"PASS" },
  { ref:"L-08", q:"Is aircraft type / variant correct?", expected:"A320-214", actual:"A320-214 (CFM56-5B4/3)", source:"Delivery Acceptance Cert.", status:"PASS" },
  { ref:"L-09", q:"Is the Delivery Date correctly recorded?", expected:"01 Apr 2022", actual:"01 Apr 2022 10:42 UTC", source:"Delivery Receipt", status:"PASS" },
  { ref:"L-10", q:"Was Delivery Condition Report signed by both parties?", expected:"Yes — dual signature", actual:"Signed by both parties", source:"Delivery Condition Report", status:"PASS" },
  { ref:"L-11", q:"Is the Acceptance Certificate executed and on file?", expected:"Yes — within 3 days of delivery", actual:"Executed 01 Apr 2022", source:"Acceptance Certificate", status:"PASS" },
  { section:"SECTION C — LEASE TERM & RENTAL PAYMENTS" },
  { ref:"L-12", q:"Is the lease commencement date correct?", expected:"01 April 2022", actual:"01 April 2022", source:"Lease Agmt. Cl. 3.1", status:"PASS" },
  { ref:"L-13", q:"Is the lease expiry date correct?", expected:"31 March 2029", actual:"31 March 2029", source:"Lease Agmt. Cl. 3.1", status:"PASS" },
  { ref:"L-14", q:"Is the monthly base rental correctly stated?", expected:"USD 400,000", actual:"USD 400,000", source:"Lease Agmt. Cl. 4.1", status:"PASS" },
  { ref:"L-15", q:"Are rental payment dates correctly specified?", expected:"1st of each month", actual:"1st calendar day", source:"Lease Agmt. Cl. 4.2", status:"PASS" },
  { ref:"L-16", q:"Has rental been paid on time for all periods?", expected:"0 late payments", actual:"1 payment delayed by 4 days (Oct-2024)", source:"Bank Statement Oct-24", status:"REVIEW" },
  { ref:"L-17", q:"Is the security deposit amount correct?", expected:"USD 800,000 (2 months)", actual:"USD 800,000 held in escrow", source:"Escrow Statement", status:"PASS" },
  { ref:"L-18", q:"Has security deposit been invested per lease terms?", expected:"Interest-bearing account", actual:"Citibank N.A. — 4.1% p.a.", source:"Escrow Bank Confirmation", status:"PASS" },
  { ref:"L-19", q:"Is there a rental escalation clause?", expected:"As per Cl. 4.6", actual:"2.5% annual escalation from Year 3", source:"Lease Agmt. Cl. 4.6", status:"PASS" },
  { ref:"L-20", q:"Has rental escalation been correctly applied?", expected:"USD 410,000 from Apr 2025", actual:"USD 410,000 effective Apr 2025", source:"Invoice #2025-04", status:"PASS" },
  { section:"SECTION D — MAINTENANCE & RETURN CONDITIONS" },
  { ref:"L-21", q:"Is there a maintenance reserve rider attached?", expected:"Yes — Schedule 3", actual:"Schedule 3 present, executed", source:"Lease Schedule 3", status:"PASS" },
  { ref:"L-22", q:"Are MR rates for airframe clearly defined?", expected:"USD/FH as per Schedule 3", actual:"USD 85/FH (Airframe heavy check)", source:"Lease Schedule 3", status:"PASS" },
  { ref:"L-23", q:"Are MR rates for engines clearly defined?", expected:"USD/FH per engine", actual:"USD 185/FH per engine (2 engines)", source:"Lease Schedule 3", status:"PASS" },
  { ref:"L-24", q:"Are MR rates for landing gear defined?", expected:"USD/cycle", actual:"USD 32/cycle", source:"Lease Schedule 3", status:"PASS" },
  { ref:"L-25", q:"Are MR rates for APU defined?", expected:"USD/APU-hour", actual:"USD 55/APU-hour", source:"Lease Schedule 3", status:"PASS" },
  { ref:"L-26", q:"Is MR reimbursement process defined?", expected:"45-day claim window", actual:"45 calendar days post-shop visit", source:"Lease Schedule 3 Cl. 8", status:"PASS" },
];

/* ─── LOAN & FINANCING AUDIT QUESTIONS ───────────────────────────────────── */
const LOAN_QUESTIONS = [
  { section:"SECTION A — LOAN AGREEMENT FUNDAMENTALS" },
  { ref:"F-01", q:"Is the loan agreement fully executed by all parties?", expected:"Yes — original signatures", actual:"Original executed 28 Mar 2022", source:"Loan Agreement p.1", status:"PASS" },
  { ref:"F-02", q:"Is the facility amount correctly stated?", expected:"USD 30,000,000", actual:"USD 30,000,000", source:"Loan Agmt. Cl. 2.1", status:"PASS" },
  { ref:"F-03", q:"Is the loan term consistent with lease term?", expected:"84 months max", actual:"84 months — matches lease", source:"Loan Agmt. Cl. 3", status:"PASS" },
  { ref:"F-04", q:"Is the interest rate type specified?", expected:"Fixed or SOFR+", actual:"SOFR + 2.45% (floating)", source:"Loan Agmt. Cl. 4.1", status:"PASS" },
  { ref:"F-05", q:"Is current SOFR rate applied correctly?", expected:"Per SOFR fixing", actual:"5.33% + 2.45% = 7.78% p.a.", source:"Bloomberg SOFR 15-Feb-25", status:"PASS" },
  { ref:"F-06", q:"Is the repayment schedule attached?", expected:"Yes — Annex B", actual:"Annex B present, 84 instalments", source:"Loan Agmt. Annex B", status:"PASS" },
  { section:"SECTION B — PRINCIPAL & INTEREST RECONCILIATION" },
  { ref:"F-07", q:"Opening loan balance (Apr 2022) correct?", expected:"USD 30,000,000", actual:"USD 30,000,000", source:"Draw Notice Apr-22", status:"PASS" },
  { ref:"F-08", q:"Current outstanding balance correct?", expected:"Per Annex B amortisation", actual:"USD 28,750,000 (Month 35)", source:"Lender Statement Feb-25", status:"PASS" },
  { ref:"F-09", q:"Total principal repaid to date correct?", expected:"USD 1,250,000", actual:"USD 1,250,000 (35 x USD 35,714)", source:"Bank Statements Apr22-Feb25", status:"PASS" },
  { ref:"F-10", q:"Total interest paid YTD (2025)?", expected:"Per schedule", actual:"USD 186,420 (Jan–Feb 2025)", source:"Bank Statements Jan-Feb 25", status:"PASS" },
  { ref:"F-11", q:"Are prepayment provisions documented?", expected:"Yes — make-whole", actual:"Make-whole + 1% call premium Yr 1-3", source:"Loan Agmt. Cl. 6", status:"PASS" },
  { ref:"F-12", q:"Has any covenant breach occurred?", expected:"None", actual:"No breaches on record", source:"Compliance Certificate", status:"PASS" },
  { section:"SECTION C — SECURITY & COLLATERAL" },
  { ref:"F-13", q:"Is mortgage over aircraft registered?", expected:"Yes — Bermuda CAA", actual:"Mortgage reg. BM-MTG-22-0089", source:"CAA Register", status:"PASS" },
  { ref:"F-14", q:"Is assignment of lease rentals in place?", expected:"Yes — Cl. 9", actual:"Executed assignment on file", source:"Security Agreement", status:"PASS" },
  { ref:"F-15", q:"Is SPV bank account charged to lender?", expected:"Yes — first fixed charge", actual:"Fixed charge over Arx SPV III account", source:"Account Charge Deed", status:"PASS" },
  { ref:"F-16", q:"Is there an insurance assignment?", expected:"Yes — lender as loss payee", actual:"Deutsche Luftfahrt Bank AG noted", source:"Ins. Certificate Jan-25", status:"PASS" },
  { ref:"F-17", q:"Is a maintenance reserve assignment in place?", expected:"Yes — Cl. 10", actual:"MR account charged to lender", source:"MR Account Charge", status:"PASS" },
  { ref:"F-18", q:"Is interest rate hedge (IRS) in place?", expected:"Yes — per hedging policy", actual:"IRS with Deutsche Bank, notional USD 28.75M", source:"ISDA Confirmation", status:"PASS" },
  { ref:"F-19", q:"Has IRS mark-to-market been calculated?", expected:"Quarterly MTM required", actual:"MTM: USD +124,500 (in-the-money) Dec-24", source:"Treasury Report Q4-24", status:"PASS" },
  { section:"SECTION D — FINANCIAL COVENANTS" },
  { ref:"F-20", q:"Loan-to-Value ratio compliant?", expected:"<75% LTV", actual:"67.6% LTV (USD 28.75M / USD 42.5M)", source:"MSRV Appraisal Feb-25", status:"PASS" },
  { ref:"F-21", q:"Debt Service Coverage Ratio compliant?", expected:"DSCR > 1.20x", actual:"DSCR = 1.48x", source:"P&L Statement Q4-24", status:"PASS" },
  { ref:"F-22", q:"Minimum liquidity covenant met?", expected:"USD 2,000,000 minimum", actual:"USD 3,150,000 in SPV account", source:"SPV Bank Statement Feb-25", status:"PASS" },
  { ref:"F-23", q:"Net Worth covenant met?", expected:"USD 5,000,000 minimum net equity", actual:"USD 7,820,000", source:"SPV Management Accounts", status:"PASS" },
  { ref:"F-24", q:"Is the compliance certificate current?", expected:"Semi-annual — last < 6 months", actual:"Dated 15 Dec 2024 (62 days)", source:"Compliance Certificate", status:"PASS" },
  { section:"SECTION E — REPRESENTATIONS & WARRANTIES" },
  { ref:"F-25", q:"Has borrower confirmed no litigation?", expected:"R&W Cl. 7.4", actual:"No litigation declared", source:"Borrower Certificate Feb-25", status:"PASS" },
];

/* ─── INSURANCE AUDIT QUESTIONS ──────────────────────────────────────────── */
const INSURANCE_QUESTIONS = [
  { section:"SECTION A — HULL ALL-RISK (HAR) POLICY" },
  { ref:"I-01", q:"Is HAR policy current and in force?", expected:"Policy period covers today", actual:"In force: 01 Jan 2025 – 31 Dec 2025", source:"HAR-2025-004487", status:"PASS" },
  { ref:"I-02", q:"Is insured value equal to or greater than MSRV?", expected:"USD 42,500,000", actual:"USD 43,000,000 (above MSRV)", source:"HAR-2025-004487 Sch. 1", status:"PASS" },
  { ref:"I-03", q:"Is AVN1C (airline policy) form used?", expected:"Yes", actual:"AVN1C — confirmed", source:"HAR-2025-004487", status:"PASS" },
  { ref:"I-04", q:"Is aircraft correctly identified on policy schedule?", expected:"MSN 7845, Reg VQ-BXY", actual:"MSN 7845 / VQ-BXY confirmed", source:"HAR-2025-004487 Sch. 1", status:"PASS" },
  { ref:"I-05", q:"Is in-flight coverage included?", expected:"Yes", actual:"All perils including in-flight", source:"HAR-2025-004487 Cl. 1", status:"PASS" },
  { ref:"I-06", q:"Is ground coverage included?", expected:"Yes", actual:"Ground risk included", source:"HAR-2025-004487 Cl. 2", status:"PASS" },
  { ref:"I-07", q:"What is the hull deductible?", expected:"Max USD 1,000,000", actual:"USD 750,000 per occurrence", source:"HAR-2025-004487 Cl. 8", status:"PASS" },
  { ref:"I-08", q:"Is the deductible within lease limits?", expected:"Yes — Cl. 11.2 of lease", actual:"Lease limit USD 1M — deductible USD 750K", source:"Lease Agmt. Cl. 11.2", status:"PASS" },
  { section:"SECTION B — WAR RISK (WR) COVERAGE" },
  { ref:"I-09", q:"Is war risk policy in force?", expected:"Yes", actual:"WR policy: 01 Jan 2025 – 31 Dec 2025", source:"WR-2025-004488", status:"PASS" },
  { ref:"I-10", q:"Is AVN67B endorsement attached?", expected:"Yes — mandatory", actual:"AVN67B — confirmed", source:"WR-2025-004488", status:"PASS" },
  { ref:"I-11", q:"Is insured value same as HAR?", expected:"USD 43,000,000", actual:"USD 43,000,000", source:"WR-2025-004488", status:"PASS" },
  { ref:"I-12", q:"Does WR coverage include hull war, SRCC, hi-jack?", expected:"All three required", actual:"Hull war ✓ / SRCC ✓ / Hi-jack ✓", source:"WR-2025-004488 Sch. 2", status:"PASS" },
  { ref:"I-13", q:"Is 7-day automatic termination clause noted?", expected:"Yes — industry standard", actual:"AT clause — confirmed", source:"WR-2025-004488 Cl. 3", status:"PASS" },
  { section:"SECTION C — THIRD-PARTY LIABILITY (TPL)" },
  { ref:"I-14", q:"Is TPL policy current?", expected:"Yes", actual:"In force: 01 Jan 2025 – 31 Dec 2025", source:"TPL-2025-004489", status:"PASS" },
  { ref:"I-15", q:"Is minimum combined single limit correct?", expected:"USD 1,500,000,000", actual:"USD 1,500,000,000 CSL", source:"TPL-2025-004489 Sch. 1", status:"PASS" },
  { ref:"I-16", q:"Is AVN52E endorsement present?", expected:"Yes", actual:"AVN52E — confirmed", source:"TPL-2025-004489", status:"PASS" },
  { ref:"I-17", q:"Is Lessor named as additional insured?", expected:"Arx SPV III Ltd", actual:"Arx SPV III Ltd — CI line 1", source:"TPL-2025-004489 CI", status:"PASS" },
  { ref:"I-18", q:"Is Lender named as additional insured?", expected:"Deutsche Luftfahrt Bank AG", actual:"Deutsche Luftfahrt Bank AG — CI line 2", source:"TPL-2025-004489 CI", status:"PASS" },
  { section:"SECTION D — ADDITIONAL INSURED & LOSS PAYEE" },
  { ref:"I-19", q:"Is Lessor named as loss payee on HAR?", expected:"Yes — first loss payee", actual:"Arx SPV III Ltd — loss payee", source:"HAR-2025-004487 LP Sch.", status:"PASS" },
  { ref:"I-20", q:"Is Lender named as loss payee?", expected:"Yes — noted as mortgagee", actual:"Deutsche Luftfahrt Bank AG — mortgagee", source:"HAR-2025-004487 LP Sch.", status:"PASS" },
  { ref:"I-21", q:"Is cancellation notice to Lessor/Lender specified?", expected:"30 days minimum", actual:"30 days written notice clause", source:"HAR-2025-004487 Cl. 10", status:"PASS" },
  { ref:"I-22", q:"Is cut-through clause present for reinsurance?", expected:"Yes where reinsured", actual:"Cut-through confirmed for layers >USD 20M", source:"HAR-2025-004487 Cl. 11", status:"PASS" },
  { section:"SECTION E — BROKER & UNDERWRITER STANDING" },
  { ref:"I-23", q:"Is broker an approved IATA member?", expected:"Yes", actual:"Marsh Aviation Ltd — IATA #04-0-00102", source:"Broker Confirmation", status:"PASS" },
  { ref:"I-24", q:"Are lead underwriters rated A- or better?", expected:"Minimum A- AM Best", actual:"Lloyd's of London (rated A / Excellent)", source:"Underwriter Rating Sheet", status:"PASS" },
  { ref:"I-25", q:"Is a broker's letter of undertaking on file?", expected:"Yes — annual", actual:"Dated 15 Jan 2025", source:"Broker Letter Jan-25", status:"PASS" },
];

/* ─── MAINTENANCE RESERVES AUDIT QUESTIONS ───────────────────────────────── */
const MR_QUESTIONS = [
  { section:"SECTION A — MR CONTRIBUTION RATE SCHEDULE (displayed separately)" },
  { ref:"MR-01", q:"Is MR account held with approved bank?", expected:"Citibank N.A. or equivalent", actual:"Citibank N.A., London", source:"MR Account Statement", status:"PASS" },
  { ref:"MR-02", q:"Is MR account interest-bearing?", expected:"Yes — quarterly interest", actual:"3.9% p.a. — quarterly credit", source:"Citibank Statement Q4-24", status:"PASS" },
  { ref:"MR-03", q:"Are MR contributions received monthly?", expected:"Yes — by 5th of month", actual:"All on time except Oct-24 (3 days late)", source:"MR Payment Log", status:"REVIEW" },
  { ref:"MR-04", q:"Have all MR contributions been reconciled?", expected:"100% reconciled", actual:"35 of 35 months reconciled", source:"MR Reconciliation Log", status:"PASS" },
  { ref:"MR-05", q:"Has any MR reimbursement claim been submitted?", expected:"Document all claims", actual:"1 claim — Engine 1 borescope, Aug-23", source:"MR Claim AER-2023-08", status:"PASS" },
  { ref:"MR-06", q:"Was MR claim supported by shop visit report?", expected:"Yes — SVR required", actual:"SVR from CFM Services, Aug-23", source:"SVR CFM-2023-0487", status:"PASS" },
  { ref:"MR-07", q:"Is MR balance sufficient for next shop visit?", expected:"75% funded", actual:"Eng 1: 81% funded; Eng 2: 83% funded", source:"Funding Model Q4-24", status:"PASS" },
  { ref:"MR-08", q:"Are APU hours tracked and MR contributions correct?", expected:"Per Annex 3 rates", actual:"214 APU-H logged; 2-hour discrepancy", source:"APU Log Jan-25", status:"REVIEW" },
  { ref:"MR-09", q:"Are landing gear cycles tracked correctly?", expected:"Per landing logs", actual:"218 vs 220 logged — 2-cycle discrepancy", source:"Landing Log vs MR Log", status:"REVIEW" },
  { ref:"MR-10", q:"Is there a funded MR shortfall?", expected:"No shortfall", actual:"No shortfall — surplus USD 148,200", source:"Funding Model Feb-25", status:"PASS" },
];

const MR_RATES = [
  { component:"Airframe — 6Y Check (C-Check)", rate:"Per FH", usd:85, period:"382 FH", accrued:1050200, balance:"1,050,200", status:"PASS" },
  { component:"Airframe — 12Y Check (D-Check)", rate:"Per FH", usd:55, period:"382 FH", accrued:692550, balance:"692,550", status:"PASS" },
  { component:"Engine 1 — CFM56-5B4 LLP/Perf", rate:"Per FH", usd:185, period:"382 FH", accrued:2328480, balance:"2,328,480", status:"PASS" },
  { component:"Engine 2 — CFM56-5B4 LLP/Perf", rate:"Per FH", usd:185, period:"382 FH", accrued:2328480, balance:"2,328,480", status:"PASS" },
  { component:"APU — Honeywell 131-9A", rate:"Per APU-H", usd:55, period:"214 APU-H", accrued:385350, balance:"385,350", status:"REVIEW" },
  { component:"Landing Gear", rate:"Per Cycle", usd:32, period:"218 Cycles", accrued:228360, balance:"228,360", status:"PASS" },
];

/* ─── UTILISATION AUDIT QUESTIONS ────────────────────────────────────────── */
const UTIL_QUESTIONS = [
  { section:"SECTION B — UTILISATION AUDIT QUESTIONS" },
  { ref:"U-01", q:"Has operator provided monthly utilisation reports?", expected:"Monthly — by 10th", actual:"All reports received on time", source:"Operator Reports File", status:"PASS" },
  { ref:"U-02", q:"Do FH match technical log entries?", expected:"100% match", actual:"Match confirmed for all months", source:"Tech Log vs Util Report", status:"PASS" },
  { ref:"U-03", q:"Do FC match technical log entries?", expected:"100% match", actual:"2-cycle discrepancy Oct-24", source:"Tech Log Oct-24", status:"REVIEW" },
  { ref:"U-04", q:"Is average daily utilisation above minimum?", expected:"9 FH/day", actual:"Avg 12.62 FH/day — 2024", source:"2024 Util Summary", status:"PASS" },
  { ref:"U-05", q:"Are APU hours tracked and reported?", expected:"Monthly per lease", actual:"Reported monthly", source:"APU Log File", status:"PASS" },
  { ref:"U-06", q:"Has aircraft been operated within approved routes?", expected:"ICAO route approval", actual:"All routes within approved network", source:"Route Approval Schedule", status:"PASS" },
  { ref:"U-07", q:"Is there any evidence of sublease without consent?", expected:"None permitted", actual:"No sublease detected", source:"Lease Monitoring Report", status:"PASS" },
  { ref:"U-08", q:"Has aircraft been operated in sanctioned territories?", expected:"None", actual:"No sanctioned territory operations", source:"Route Database Feb-25", status:"PASS" },
  { ref:"U-09", q:"Has aircraft undergone any wet lease?", expected:"Notify lessor required", actual:"1 wet lease — Ryanair, Jun-24, 14 days", source:"Wet Lease Notification", status:"PASS" },
  { ref:"U-10", q:"Is total time since new (TSN) current?", expected:"As per tech log", actual:"TSN: 42,850 FH / 24,190 FC", source:"Tech Log Feb-25", status:"PASS" },
];

const UTIL_LOG = [
  { month:"Jan 2024", fh:382, fc:218, apu:214, fhDay:"7.03", fcDay:"6.90", sector:"1.02", status:"PASS" },
  { month:"Feb 2024", fh:356, fc:204, apu:198, fhDay:"7.03", fcDay:"6.83", sector:"1.03", status:"PASS" },
  { month:"Mar 2024", fh:401, fc:228, apu:221, fhDay:"7.35", fcDay:"7.13", sector:"1.03", status:"PASS" },
  { month:"Apr 2024", fh:388, fc:220, apu:210, fhDay:"7.33", fcDay:"7.00", sector:"1.05", status:"PASS" },
  { month:"May 2024", fh:415, fc:235, apu:225, fhDay:"7.58", fcDay:"7.26", sector:"1.04", status:"PASS" },
  { month:"Jun 2024", fh:402, fc:229, apu:218, fhDay:"7.63", fcDay:"7.27", sector:"1.05", status:"PASS" },
  { month:"Jul 2024", fh:445, fc:252, apu:241, fhDay:"8.13", fcDay:"7.77", sector:"1.05", status:"PASS" },
  { month:"Aug 2024", fh:438, fc:249, apu:237, fhDay:"8.03", fcDay:"7.65", sector:"1.05", status:"PASS" },
  { month:"Sep 2024", fh:395, fc:224, apu:215, fhDay:"7.47", fcDay:"7.17", sector:"1.04", status:"PASS" },
  { month:"Oct 2024", fh:378, fc:214, apu:207, fhDay:"6.90", fcDay:"6.68", sector:"1.03", status:"PASS" },
  { month:"Nov 2024", fh:362, fc:206, apu:198, fhDay:"6.87", fcDay:"6.60", sector:"1.04", status:"PASS" },
  { month:"Dec 2024", fh:391, fc:222, apu:213, fhDay:"7.16", fcDay:"6.87", sector:"1.04", status:"PASS" },
  { month:"Jan 2025", fh:382, fc:218, apu:208, fhDay:"7.03", fcDay:"6.71", sector:"1.05", status:"PASS" },
];

/* ─── FINANCIAL RECONCILIATION AUDIT QUESTIONS ───────────────────────────── */
const FINRECON_QUESTIONS = [
  { section:"SECTION B — RECONCILIATION AUDIT QUESTIONS" },
  { ref:"R-01", q:"Do bank receipts match lease invoices?", expected:"100% match", actual:"USD 410,000 — exact match Jan-25", source:"Invoice INV-2025-001", status:"PASS" },
  { ref:"R-02", q:"Has lease invoice been issued on correct date?", expected:"1st of month", actual:"Invoice date 01 Jan 2025", source:"Invoice Log", status:"PASS" },
  { ref:"R-03", q:"Has MR contribution been correctly calculated?", expected:"Per Schedule 3 rates", actual:"USD 181,886 — calculation verified", source:"MR Calculation Sheet", status:"PASS" },
  { ref:"R-04", q:"Are all bank transactions classified correctly?", expected:"Yes", actual:"All 14 transactions coded", source:"Bank Statement Jan-25", status:"PASS" },
  { ref:"R-05", q:"Are there any unidentified credits?", expected:"None", actual:"No unidentified credits", source:"Bank Statement Jan-25", status:"PASS" },
  { ref:"R-06", q:"Are there any unidentified debits?", expected:"None", actual:"No unidentified debits", source:"Bank Statement Jan-25", status:"PASS" },
  { ref:"R-07", q:"Has loan interest been correctly calculated?", expected:"Per SOFR + 2.45%", actual:"USD 186,920 — matches lender statement", source:"Lender Statement Jan-25", status:"PASS" },
  { ref:"R-08", q:"Has waterfall been applied correctly?", expected:"5-tier per loan agmt.", actual:"Waterfall: Ops>Int>Prin>MR>Equity", source:"Waterfall Schedule", status:"PASS" },
];

const PNL_DATA = [
  { item:"Base Lease Rental Received", scheduled:410000, actual:410000, type:"income" },
  { item:"Supplemental Rental (ACMI)", scheduled:0, actual:0, type:"income" },
  { item:"MR Contribution Received", scheduled:181886, actual:181886, type:"income" },
  { item:"Interest on Escrow/MR Accounts", scheduled:1850, actual:1892, type:"income" },
  { item:"Late Payment Fee Received", scheduled:0, actual:0, type:"income" },
  { item:"Loan Interest Payment", scheduled:186920, actual:186920, type:"expense" },
  { item:"Principal Repayment", scheduled:35714, actual:35714, type:"expense" },
  { item:"SPV Management Fee", scheduled:12500, actual:12500, type:"expense" },
  { item:"Legal & Professional Fees", scheduled:4200, actual:4200, type:"expense" },
  { item:"Security Trustee Fee", scheduled:1000, actual:1000, type:"expense" },
  { item:"Account Bank Fees", scheduled:450, actual:450, type:"expense" },
  { item:"Insurance Premium Allocation", scheduled:8333, actual:8333, type:"expense" },
  { item:"Audit & Compliance Fees", scheduled:3500, actual:3500, type:"expense" },
];

/* ─── EXCEPTION TRACKER ──────────────────────────────────────────────────── */
const EXCEPTIONS = [
  { id:"EX-001", cat:"Lease Agreement", auditRef:"L-16", desc:"Lease rental payment delayed by 4 days in Oct-2024. Late fee of USD 2,100 applied per Cl. 4.5.", sev:"LOW", date:"15-Nov-24", owner:"Meridian Air LLC", target:"31-Mar-25", resolution:"Late fee collected. Operator warned. No repeat since.", status:"CLOSED" },
  { id:"EX-002", cat:"Maintenance Reserves", auditRef:"MR-03", desc:"MR contribution received 3 days late in Oct-2024. No penalty clause triggered.", sev:"LOW", date:"15-Nov-24", owner:"Meridian Air LLC", target:"28-Feb-25", resolution:"Operator confirmed direct debit set up — no repeat.", status:"CLOSED" },
  { id:"EX-003", cat:"Utilisation Data", auditRef:"U-03", desc:"2-cycle discrepancy between technical log and utilisation report for Oct-2024.", sev:"MEDIUM", date:"12-Nov-24", owner:"Meridian Air LLC", target:"28-Feb-25", resolution:"Operator investigating — response pending.", status:"OPEN" },
  { id:"EX-004", cat:"Maintenance Reserves", auditRef:"MR-08", desc:"APU hours discrepancy — 2-hour gap between APU log and MR contribution basis.", sev:"LOW", date:"15-Feb-25", owner:"Meridian Air LLC", target:"31-Mar-25", resolution:"Under review — expected to be data entry error.", status:"OPEN" },
  { id:"EX-005", cat:"Maintenance Reserves", auditRef:"MR-09", desc:"Landing gear cycle discrepancy — 2 cycles per above.", sev:"LOW", date:"15-Feb-25", owner:"Meridian Air LLC", target:"31-Mar-25", resolution:"Same root cause as EX-003 — joint investigation.", status:"OPEN" },
  { id:"EX-006", cat:"Loan & Financing", auditRef:"F-36", desc:"Amendment No.1 (rate reset Jan 2024) not referenced in compliance certificate.", sev:"MEDIUM", date:"15-Feb-25", owner:"Arx SPV III", target:"28-Feb-25", resolution:"Next compliance cert. to include amendment reference.", status:"OPEN" },
  { id:"EX-007", cat:"Financial Reconciliation", auditRef:"R-10", desc:"Distribution of USD 300,000 requires board resolution filing with Bermuda CAA.", sev:"LOW", date:"15-Feb-25", owner:"Arx SPV III", target:"15-Mar-25", resolution:"Board resolution being prepared — filing imminent.", status:"OPEN" },
];

/* ─── BANK RECON DATA ────────────────────────────────────────────────────── */
const BANK_DATA = [
  { month:"Jan", rent:395000, mr:192556, interest:189420, principal:35714, status:"ok" },
  { month:"Feb", rent:395000, mr:198340, interest:187990, principal:35714, status:"ok" },
  { month:"Mar", rent:395000, mr:203780, interest:188750, principal:35714, status:"ok" },
  { month:"Apr", rent:404875, mr:208920, interest:186200, principal:35714, status:"ok" },
  { month:"May", rent:404875, mr:214560, interest:185400, principal:35714, status:"ok" },
  { month:"Jun", rent:404875, mr:213400, interest:184600, principal:35714, status:"ok" },
  { month:"Jul", rent:404875, mr:209780, interest:183800, principal:35714, status:"ok" },
  { month:"Aug", rent:404875, mr:218340, interest:183000, principal:35714, status:"ok" },
  { month:"Sep", rent:404875, mr:211200, interest:182200, principal:35714, status:"ok" },
  { month:"Oct", rent:404875, mr:190036, interest:181400, principal:35714, status:"exception" },
  { month:"Nov", rent:404875, mr:215600, interest:180600, principal:35714, status:"ok" },
  { month:"Dec", rent:404875, mr:210800, interest:180490, principal:35714, status:"ok" },
];

const WATERFALL = [
  { name:"Opening",  val:3021445, type:"total"    },
  { name:"Rent",     val:4854750, type:"positive" },
  { name:"MR In",    val:2199428, type:"positive" },
  { name:"Other",    val:123336,  type:"positive" },
  { name:"Interest", val:2233150, type:"negative" },
  { name:"Principal",val:428568,  type:"negative" },
  { name:"Equity",   val:1180000, type:"negative" },
  { name:"OpEx",     val:119369,  type:"negative" },
  { name:"Closing",  val:3258922, type:"total"    },
];

/* ─── STREAM LINES ───────────────────────────────────────────────────────── */
const STREAM_LINES = [
  "Reading Lease Agreement — Ref: ARX-SPV3-LEASE-2022-7845...",
  "  ↳ Lessor: Arx Aviation SPV III Ltd (Ireland) [Cover Page]",
  "  ↳ Lessee: Meridian Air LLC (Bermuda reg. no. 87234) [Cover Page]",
  "  ↳ Lease term: 1 Apr 2022 → 31 Mar 2029 — 84 months [Cl. 3.1]",
  "  ↳ Base rent: USD 400,000/month, escalates 2.5% p.a. from Year 3 [Cl. 4.1/4.6]",
  "  ↳ Security deposit: USD 800,000 held in escrow [Cl. 4.7]",
  "Reading Loan Agreement — Ref: DLB-ARX-2022-001...",
  "  ↳ Facility: USD 30,000,000 | Rate: SOFR + 2.45% [Cl. 4.1]",
  "  ↳ Outstanding: USD 28,750,000 (Month 35) | DSCR: 1.48x",
  "  ↳ LTV: 67.6% — within 75% covenant [Cl. 6.1]",
  "Reading Insurance Pack — HAR / WR / TPL policies...",
  "  ↳ Hull value: USD 43,000,000 (above MSRV of USD 42.5M)",
  "  ↳ All policies in force Jan–Dec 2025, broker: Marsh Aviation",
  "Reading Maintenance Reserve Schedule & Shop Visit Reports...",
  "  ↳ MR balance: USD 5,270,670 across 6 components",
  "  ↳ Engine funding: 81–83% — above 75% threshold",
  "Reading Utilisation & Flight Data — 13 months...",
  "  ↳ Total FH: 4,753 | FC: 2,701 | Avg 12.62 FH/day",
  "  ↳ 2-cycle discrepancy Oct-24 flagged for investigation",
  "Reconciling Financial Statements — P&L Jan 2025...",
  "  ↳ Net Profit: USD 341,161 | Variance: USD 42 (interest)",
  "  ↳ Waterfall applied correctly: Ops>Int>Prin>MR>Equity",
  "Cross-referencing Exception Tracker — 7 items found...",
  "  ↳ 2 CLOSED | 5 OPEN | 2 MEDIUM severity",
  "✓ Full audit complete. 207 questions assessed across 8 categories.",
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SPVAuditDemo() {
  const [phase, setPhase]               = useState(0);
  const [activeTab, setActiveTab]       = useState("lease");
  const [filledRows, setFilledRows]     = useState(new Set());
  const [pulseRow, setPulseRow]         = useState(null);
  const [agentLog, setAgentLog]         = useState([]);
  const [streamText, setStreamText]     = useState("");
  const [streamDone, setStreamDone]     = useState(false);
  const [docsScanned, setDocsScanned]   = useState([]);
  const [progress, setProgress]         = useState(0);
  const [bankReady, setBankReady]       = useState(false);
  const [excReady, setExcReady]         = useState(false);
  const [pnlReady, setPnlReady]        = useState(false);
  const [finReconReady, setFinReconReady] = useState(false);
  const [mrRatesReady, setMrRatesReady] = useState(false);
  const [utilLogReady, setUtilLogReady] = useState(false);
  const [txCount, setTxCount]           = useState(0);
  const logRef  = useRef(null);
  const stopRef = useRef(false);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentLog, streamText]);

  const addLog = useCallback((text, type = "info") => {
    setAgentLog(p => [...p, { text, type, id: Math.random() }]);
  }, []);

  const delay = ms => new Promise(r => setTimeout(r, ms));

  const simulateStream = async lines => {
    let full = "";
    for (const line of lines) {
      if (stopRef.current) return;
      for (const ch of line) {
        if (stopRef.current) return;
        full += ch;
        setStreamText(full);
        await delay(Math.random() * 12 + 4);
      }
      full += "\n";
      setStreamText(full);
      await delay(40);
    }
    setStreamDone(true);
    await delay(400);
    setStreamText("");
  };

  /* helper: fill rows for a given question set */
  const fillQuestionRows = async (questions, tabId, logLabel, progressStart, progressEnd) => {
    setActiveTab(tabId);
    await delay(200);
    const dataRows = questions.filter(q => q.ref);
    for (let i = 0; i < dataRows.length; i++) {
      if (stopRef.current) return;
      await delay(70);
      const key = dataRows[i].ref;
      setPulseRow(key);
      setFilledRows(p => new Set([...p, key]));
      setProgress(Math.round(progressStart + (i + 1) / dataRows.length * (progressEnd - progressStart)));
      if (i % 5 === 0) addLog(`  ↳  ${key}: ${dataRows[i].status === "PASS" ? "✓" : dataRows[i].status === "REVIEW" ? "⚠" : "✗"} ${dataRows[i].q.substring(0, 55)}...`, dataRows[i].status === "PASS" ? "field" : "warn");
    }
    setPulseRow(null);
    const pass = dataRows.filter(r => r.status === "PASS").length;
    const review = dataRows.filter(r => r.status === "REVIEW").length;
    const fail = dataRows.filter(r => r.status === "FAIL").length;
    addLog(`  ✓  ${logLabel}: ${pass} PASS | ${review} REVIEW | ${fail} FAIL`, "ok");
  };

  /* ─── RUN DEMO ─────────────────────────────────────────────────────────── */
  const runDemo = async () => {
    stopRef.current = false;
    setPhase(1);
    setFilledRows(new Set()); setPulseRow(null);
    setAgentLog([]); setStreamText(""); setStreamDone(false);
    setDocsScanned([]); setProgress(0);
    setBankReady(false); setExcReady(false); setPnlReady(false);
    setFinReconReady(false); setMrRatesReady(false); setUtilLogReady(false);
    setTxCount(0); setActiveTab("lease");

    addLog("━━━  SPV AI AUDIT ENGINE  v2.1  ━━━", "header");
    addLog("▶  Scanning aircraft document folder...", "info");
    await delay(250);

    for (const doc of DOCUMENTS) {
      if (stopRef.current) return;
      await delay(150);
      setDocsScanned(p => [...p, doc.name]);
      addLog(`  ✓  ${doc.name}  [${doc.type}]  ${doc.size}`, "ok");
    }

    await delay(150);
    addLog("", "blank");
    addLog("▶  Step 1/7 — Reading all documents & extracting data...", "info");
    await delay(250);
    await simulateStream(STREAM_LINES);
    if (stopRef.current) return;

    addLog("", "blank");
    addLog("▶  Step 2/7 — Lease Agreement Compliance (26 questions)...", "info");
    await fillQuestionRows(LEASE_QUESTIONS, "lease", "Lease Agreement", 5, 18);
    if (stopRef.current) return;

    addLog("", "blank");
    addLog("▶  Step 3/7 — Loan & Financing Review (25 questions)...", "info");
    await fillQuestionRows(LOAN_QUESTIONS, "loan", "Loan & Financing", 18, 32);
    if (stopRef.current) return;

    addLog("", "blank");
    addLog("▶  Step 4/7 — Insurance Verification (25 questions)...", "info");
    await fillQuestionRows(INSURANCE_QUESTIONS, "insurance", "Insurance", 32, 44);
    if (stopRef.current) return;

    addLog("", "blank");
    addLog("▶  Step 5/7 — Maintenance Reserves & Utilisation...", "info");
    setMrRatesReady(true);
    await fillQuestionRows(MR_QUESTIONS, "mr", "Maintenance Reserves", 44, 54);
    if (stopRef.current) return;
    setUtilLogReady(true);
    await fillQuestionRows(UTIL_QUESTIONS, "util", "Utilisation & Flight Data", 54, 64);
    if (stopRef.current) return;

    addLog("", "blank");
    addLog("▶  Step 6/7 — Financial Reconciliation & Bank Recon...", "info");
    setFinReconReady(true);
    await fillQuestionRows(FINRECON_QUESTIONS, "finrecon", "Financial Reconciliation", 64, 72);
    if (stopRef.current) return;

    setActiveTab("bank");
    await delay(250);
    for (let i = 0; i <= 152; i += 7) {
      if (stopRef.current) return;
      setTxCount(Math.min(i, 152));
      await delay(25);
    }
    setBankReady(true);
    setProgress(80);
    await delay(200);
    for (const row of BANK_DATA) {
      if (stopRef.current) return;
      await delay(50);
      if (row.status === "exception")
        addLog(`  ⚠   Oct-2024 Base Rent — 4 days late → Clause 4.5 triggered`, "warn");
    }
    addLog("  ✓  151 transactions matched | 1 exception flagged", "ok");

    addLog("", "blank");
    addLog("▶  Step 7/7 — Exception Tracker & P&L Dashboard...", "info");
    setActiveTab("exceptions");
    await delay(350);
    setExcReady(true);
    setProgress(90);
    for (const ex of EXCEPTIONS) {
      if (stopRef.current) return;
      await delay(150);
      addLog(`  ${ex.status === "CLOSED" ? "✓" : "⚠"}  ${ex.id} [${ex.sev}] ${ex.cat} — ${ex.status}`,
        ex.status === "CLOSED" ? "ok" : "warn");
    }

    setActiveTab("pnl");
    await delay(400);
    setPnlReady(true);
    setProgress(100);

    addLog("", "blank");
    addLog("━━━  AUDIT COMPLETE  ━━━", "header");
    addLog("  207 audit questions assessed across 8 categories", "ok");
    addLog("  DSCR: 1.48×   ✓ COMPLIANT   (min 1.20×)", "ok");
    addLog("  LTV:  67.6%   ✓ COMPLIANT   (max 75.0%)", "ok");
    addLog("  Open exceptions: 5  |  Closed: 2", "warn");
    addLog("  Manual time: ~14 hrs  →  Agent time: ~50 sec", "dim");
    setPhase(2);
  };

  const reset = () => {
    stopRef.current = true;
    setPhase(0); setActiveTab("lease");
    setFilledRows(new Set()); setPulseRow(null);
    setAgentLog([]); setStreamText(""); setStreamDone(false);
    setDocsScanned([]); setProgress(0);
    setBankReady(false); setExcReady(false); setPnlReady(false);
    setFinReconReady(false); setMrRatesReady(false); setUtilLogReady(false);
    setTxCount(0);
  };

  /* ─── REUSABLE COMPONENTS ──────────────────────────────────────────────── */
  const Badge = ({ type }) => {
    const map = {
      LEASE:"#1A5276,#D6EAF8", LOAN:"#0E6655,#D5F5E3", INSURANCE:"#7D5A00,#FEF9E7",
      MR:"#6C3483,#F5EEF8", UTIL:"#1A5276,#EBF5FB", DELIVERY:"#1E3A5F,#D6E4F0",
      SVR:"#7B241C,#FDEDEC", LEGAL:"#424242,#F2F3F4", BANK:"#7D5A00,#FEF3CD", AUDIT:"#B8860B,#FFF8DC",
    };
    const raw = map[type] || "#555,#eee";
    const [fg, bg] = raw.split(",");
    return (
      <span style={{ background: bg, color: fg, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 8, letterSpacing: ".3px", whiteSpace: "nowrap", flexShrink: 0 }}>
        {type}
      </span>
    );
  };

  const StatusBadge = ({ s }) => {
    const c = s === "PASS" ? "#0E8345" : s === "REVIEW" ? "#D4700A" : s === "FAIL" ? "#D32F2F" : "#6B7FA0";
    const icon = s === "PASS" ? "✓" : s === "REVIEW" ? "⚠" : s === "FAIL" ? "✗" : "…";
    return (
      <span style={{ background:`${c}18`, color:c, padding:"2px 8px", borderRadius:10, fontSize:9, fontWeight:700 }}>
        {icon} {s}
      </span>
    );
  };

  /* ─── AUDIT QUESTION TABLE ─────────────────────────────────────────────── */
  const AuditTable = ({ questions, title, subtitle }) => {
    return (
      <div style={{ flex:1, overflow:"auto" }}>
        <div style={{ padding:"7px 12px", background:"#F0F2F8", borderBottom:"1px solid #E0E4EB", fontSize:10.5, color:"#6B7FA0" }}>
          <b style={{ color:"#1A3A5C" }}>{title}</b> &nbsp;— {subtitle}
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#F7F8FC" }}>
              {["REF","AUDIT QUESTION","EXPECTED","ACTUAL","SOURCE DOCUMENT","STATUS"].map(h => (
                <th key={h} style={{ padding:"7px 8px", fontSize:8.5, color:"#6B7FA0", fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:".4px", borderBottom:"2px solid #D0D5E0",
                  width: h==="REF"?"5%":h==="AUDIT QUESTION"?"30%":h==="EXPECTED"?"18%":h==="ACTUAL"?"22%":h==="SOURCE DOCUMENT"?"14%":"11%" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((row, i) => {
              if (row.section) {
                return (
                  <tr key={`sec-${i}`} style={{ background:"#F0F2F8" }}>
                    <td colSpan={6} style={{ padding:"8px 10px", fontSize:10, fontWeight:800, color:"#B8860B", letterSpacing:".3px" }}>
                      {row.section}
                    </td>
                  </tr>
                );
              }
              const filled = filledRows.has(row.ref);
              const active = pulseRow === row.ref;
              return (
                <tr key={row.ref} style={{
                  background: active ? "#FFFDE7" : (i % 2 === 0 ? "#FFFFFF" : "#F9FAFB"),
                  borderBottom: "1px solid #EDF0F5",
                  transition: "background .3s ease",
                }}>
                  <td style={{ padding:"6px 8px", fontSize:10, color:"#B8860B", fontFamily:"monospace", fontWeight:700 }}>{row.ref}</td>
                  <td style={{ padding:"6px 8px", fontSize:10.5, color:"#1A3A5C", lineHeight:1.35 }}>{row.q}</td>
                  <td style={{ padding:"6px 8px", fontSize:10.5, color:"#4A6A8A" }}>{row.expected}</td>
                  <td style={{ padding:"6px 8px", fontSize:10.5, fontWeight: filled ? 600 : 400,
                    color: active ? "#B8860B" : filled ? (row.status==="PASS"?"#0E8345":row.status==="REVIEW"?"#D4700A":"#D32F2F") : "#C8D0DA",
                    transition: "color .3s" }}>
                    {filled ? row.actual : "—"}
                    {active && <span style={{ marginLeft:5, color:"#F0C040", fontSize:9, animation:"blink .8s infinite" }}>●</span>}
                  </td>
                  <td style={{ padding:"6px 8px", fontSize:10, color: filled ? "#4A6A8A" : "#C8D0DA", fontFamily:"monospace" }}>
                    {filled ? row.source : "—"}
                  </td>
                  <td style={{ padding:"6px 8px" }}>
                    {filled ? <StatusBadge s={row.status}/> : <span style={{ color:"#B0BEC5", fontSize:9 }}>PENDING</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* ─── TAB CONFIG ───────────────────────────────────────────────────────── */
  const leaseDataRows = LEASE_QUESTIONS.filter(q => q.ref);
  const loanDataRows = LOAN_QUESTIONS.filter(q => q.ref);
  const insDataRows = INSURANCE_QUESTIONS.filter(q => q.ref);
  const mrDataRows = MR_QUESTIONS.filter(q => q.ref);
  const utilDataRows = UTIL_QUESTIONS.filter(q => q.ref);
  const finDataRows = FINRECON_QUESTIONS.filter(q => q.ref);

  const filledCount = filledRows.size;
  const totalQuestions = leaseDataRows.length + loanDataRows.length + insDataRows.length + mrDataRows.length + utilDataRows.length + finDataRows.length;

  const TABS = [
    { id:"lease",      label:"📋 Lease",            ready: filledRows.size > 0 },
    { id:"loan",       label:"💰 Loan & Finance",   ready: loanDataRows.some(r => filledRows.has(r.ref)) },
    { id:"insurance",  label:"🛡 Insurance",         ready: insDataRows.some(r => filledRows.has(r.ref)) },
    { id:"mr",         label:"🔧 Maint. Reserves",  ready: mrDataRows.some(r => filledRows.has(r.ref)) },
    { id:"util",       label:"✈️ Utilisation",        ready: utilDataRows.some(r => filledRows.has(r.ref)) },
    { id:"finrecon",   label:"📊 Fin. Recon",        ready: finDataRows.some(r => filledRows.has(r.ref)) },
    { id:"bank",       label:"🏦 Bank Recon",        ready: bankReady },
    { id:"exceptions", label:"⚠️ Exceptions",         ready: excReady },
    { id:"pnl",        label:"📈 P&L Dashboard",     ready: pnlReady },
  ];

  const totalRent  = BANK_DATA.reduce((s, r) => s + r.rent, 0);
  const totalMR    = BANK_DATA.reduce((s, r) => s + r.mr, 0);
  const totalInt   = BANK_DATA.reduce((s, r) => s + r.interest, 0);
  const totalPrinc = BANK_DATA.reduce((s, r) => s + r.principal, 0);

  const logClr = { header:"#F0C040", ok:"#27AE60", warn:"#E67E22", error:"#E74C3C", field:"#17A589", dim:"#6B7FA0", info:"#5D8BAD" };

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh",
      background:"#0B1929", fontFamily:"'Segoe UI',system-ui,sans-serif",
      color:"#E2EAF4", overflow:"hidden", fontSize:13 }}>

      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:.1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:#0F2035 }
        ::-webkit-scrollbar-thumb { background:#1E4070; border-radius:2px }
        .tab-pill { cursor:pointer; transition:all .15s; user-select:none; }
        .tab-pill:hover { opacity:.8; }
        .run-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 28px rgba(184,134,11,.5) !important; filter:brightness(1.1); }
        .run-btn { transition:all .18s; }
        .doc-row { transition:color .22s; }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(90deg,#0C2545 0%,#0E3A6E 100%)",
        padding:"10px 18px", borderBottom:"2.5px solid #B8860B",
        display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
        <span style={{ fontSize:22 }}>✈️</span>
        <div>
          <div style={{ fontSize:14, fontWeight:700, letterSpacing:".3px" }}>
            SPV Aviation Audit AI Agent
          </div>
          <div style={{ fontSize:9.5, color:"#7BAAD4" }}>
            Arx Aviation SPV III Ltd &nbsp;|&nbsp; MSN 7845 — A320-200 (VQ-BXY)
            &nbsp;|&nbsp; <span style={{ color:"#F0C040", fontWeight:600 }}>claude-sonnet-4-6</span>
          </div>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", gap:9, alignItems:"center" }}>
          {phase === 2 && [
            ["Audit Score","86.7%","#27AE60"],
            ["DSCR","1.48×","#27AE60"],
            ["LTV","67.6%","#27AE60"],
            ["Exceptions","5 Open","#E67E22"],
          ].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:"center", background:"rgba(255,255,255,.06)",
              padding:"4px 11px", borderRadius:6, borderTop:`2px solid ${c}`,
              animation:"fadeUp .4s ease" }}>
              <div style={{ fontSize:9, color:"#7BAAD4" }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:800, color:c }}>{v}</div>
            </div>
          ))}
          {phase === 0 && (
            <div style={{ fontSize:10.5, color:"#3A5A7A", fontStyle:"italic" }}>
              🎬 Demo mode — no API key needed
            </div>
          )}
          {phase === 1 && (
            <div style={{ fontSize:10, color:"#F0C040", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:10, height:10, border:"2px solid #F0C040",
                borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
              Running audit...
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {phase === 1 && (
        <div style={{ height:3, background:"#E0E4EB", flexShrink:0 }}>
          <div style={{ height:"100%", width:`${progress}%`,
            background:"linear-gradient(90deg,#B8860B,#F5D76E)",
            transition:"width .5s ease" }} />
        </div>
      )}

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ══ MAIN PANEL ═══════════════════════════════════════════════════ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          overflow:"hidden", borderRight:"1px solid #D0D5E0", background:"#FFFFFF" }}>

          {/* Tabs */}
          <div style={{ display:"flex", background:"#F5F6FA",
            padding:"7px 8px 0", gap:1, borderBottom:"1px solid #E0E4EB",
            flexShrink:0, overflowX:"auto", alignItems:"flex-end" }}>
            {TABS.map(t => (
              <div key={t.id} className="tab-pill" onClick={() => setActiveTab(t.id)}
                style={{ padding:"5px 9px", fontSize:10, fontWeight:600,
                  borderRadius:"5px 5px 0 0",
                  background: activeTab===t.id ? "#FFFFFF" : "transparent",
                  color: activeTab===t.id ? "#1A3A5C" : t.ready ? "#5D8BAD" : "#A0AEC0",
                  borderBottom: activeTab===t.id ? "2px solid #B8860B" : "2px solid transparent",
                  whiteSpace:"nowrap" }}>
                {t.label}
              </div>
            ))}
            {filledCount > 0 && (
              <div style={{ marginLeft:"auto", alignSelf:"center",
                background:"rgba(39,174,96,.1)", color:"#1B8A4A",
                padding:"3px 9px", borderRadius:11, fontSize:9.5, fontWeight:700,
                animation:"fadeUp .3s ease", flexShrink:0 }}>
                {filledCount}/{totalQuestions} questions ✓
              </div>
            )}
          </div>

          {/* ─ Lease Agreement Tab ──────────────────────────────────────── */}
          <div style={{ display: activeTab === "lease" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <AuditTable questions={LEASE_QUESTIONS} title="Lease Agreement Audit" subtitle="DOC1_Aircraft_Lease_Agreement.pdf — 26 questions" />
          </div>

          {/* ─ Loan & Financing Tab ────────────────────────────────────── */}
          <div style={{ display: activeTab === "loan" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <AuditTable questions={LOAN_QUESTIONS} title="Loan & Financing Audit" subtitle="DOC2_Loan_Security_Agreement.pdf — 25 questions" />
          </div>

          {/* ─ Insurance Tab ───────────────────────────────────────────── */}
          <div style={{ display: activeTab === "insurance" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <AuditTable questions={INSURANCE_QUESTIONS} title="Insurance Verification Audit" subtitle="DOC3_Insurance_Certificate_Pack.pdf — 25 questions" />
          </div>

          {/* ─ Maintenance Reserves Tab ────────────────────────────────── */}
          <div style={{ display: activeTab === "mr" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflow:"auto" }}>
              <div style={{ padding:"7px 12px", background:"#F0F2F8", borderBottom:"1px solid #E0E4EB", fontSize:10.5, color:"#6B7FA0" }}>
                <b style={{ color:"#1A3A5C" }}>Maintenance Reserve Audit</b> &nbsp;— DOC4_Maintenance_Reserve_Schedule.pdf
              </div>

              {/* MR Rate Schedule */}
              <div style={{ padding:"8px 12px", borderBottom:"1px solid #E0E4EB" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#B8860B", marginBottom:6, letterSpacing:".3px" }}>
                  SECTION A — MR CONTRIBUTION RATE SCHEDULE
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F7F8FC" }}>
                      {["COMPONENT","RATE TYPE","RATE (USD)","PERIOD JAN-25","TOTAL BALANCE","STATUS"].map(h => (
                        <th key={h} style={{ padding:"6px 8px", fontSize:8.5, color:"#6B7FA0", fontWeight:700, textAlign:"left", textTransform:"uppercase", borderBottom:"2px solid #D0D5E0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MR_RATES.map((r, i) => (
                      <tr key={i} style={{ background: i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5" }}>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#1A3A5C", fontWeight:600 }}>{r.component}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#4A6A8A" }}>{r.rate}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#0E8345", fontFamily:"monospace", fontWeight:700 }}>
                          {mrRatesReady ? `$${r.usd}` : "—"}
                        </td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color: mrRatesReady ? "#4A6A8A" : "#C8D0DA" }}>
                          {mrRatesReady ? r.period : "—"}
                        </td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color: mrRatesReady ? "#0E8345" : "#C8D0DA", fontFamily:"monospace", fontWeight:700 }}>
                          {mrRatesReady ? `$${r.balance}` : "—"}
                        </td>
                        <td style={{ padding:"6px 8px" }}>
                          {mrRatesReady ? <StatusBadge s={r.status}/> : <span style={{ color:"#B0BEC5", fontSize:9 }}>PENDING</span>}
                        </td>
                      </tr>
                    ))}
                    {mrRatesReady && (
                      <tr style={{ background:"#F0F2F8", borderTop:"2px solid #D0D5E0" }}>
                        <td colSpan={4} style={{ padding:"7px 8px", fontSize:11, fontWeight:800, color:"#B8860B" }}>TOTAL MR BALANCE</td>
                        <td style={{ padding:"7px 8px", fontSize:12, fontWeight:800, color:"#0E8345", fontFamily:"monospace" }}>$5,270,670</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MR Audit Questions */}
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F7F8FC" }}>
                    {["REF","AUDIT QUESTION","EXPECTED","ACTUAL","SOURCE DOCUMENT","STATUS"].map(h => (
                      <th key={h} style={{ padding:"7px 8px", fontSize:8.5, color:"#5D8BAD", fontWeight:700, textAlign:"left", textTransform:"uppercase", letterSpacing:".4px", borderBottom:"2px solid #1E3A5F",
                        width: h==="REF"?"5%":h==="AUDIT QUESTION"?"30%":h==="EXPECTED"?"18%":h==="ACTUAL"?"22%":h==="SOURCE DOCUMENT"?"14%":"11%" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MR_QUESTIONS.map((row, i) => {
                    if (row.section) return (
                      <tr key={`sec-${i}`} style={{ background:"#F0F2F8" }}>
                        <td colSpan={6} style={{ padding:"8px 10px", fontSize:10, fontWeight:800, color:"#F0C040" }}>SECTION B — MR AUDIT QUESTIONS</td>
                      </tr>
                    );
                    const filled = filledRows.has(row.ref);
                    const active = pulseRow === row.ref;
                    return (
                      <tr key={row.ref} style={{ background: active ? "#FFFDE7" : i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5", transition:"background .3s" }}>
                        <td style={{ padding:"6px 8px", fontSize:10, color:"#B8860B", fontFamily:"monospace", fontWeight:700 }}>{row.ref}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#1A3A5C", lineHeight:1.35 }}>{row.q}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#4A6A8A" }}>{row.expected}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, fontWeight: filled?600:400, color: active?"#B8860B":filled?(row.status==="PASS"?"#0E8345":"#D4700A"):"#C8D0DA" }}>
                          {filled ? row.actual : "—"}{active && <span style={{ marginLeft:5, color:"#F0C040", fontSize:9, animation:"blink .8s infinite" }}>●</span>}
                        </td>
                        <td style={{ padding:"6px 8px", fontSize:10, color:filled?"#4A6A8A":"#C8D0DA", fontFamily:"monospace" }}>{filled ? row.source : "—"}</td>
                        <td style={{ padding:"6px 8px" }}>{filled ? <StatusBadge s={row.status}/> : <span style={{ color:"#B0BEC5", fontSize:9 }}>PENDING</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─ Utilisation & Flight Data Tab ───────────────────────────── */}
          <div style={{ display: activeTab === "util" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflow:"auto" }}>
              <div style={{ padding:"7px 12px", background:"#F0F2F8", borderBottom:"1px solid #E0E4EB", fontSize:10.5, color:"#6B7FA0" }}>
                <b style={{ color:"#1A3A5C" }}>Utilisation & Flight Data Audit</b> &nbsp;— DOC5_Aircraft_Utilisation_Report.pdf
              </div>

              {/* Monthly Utilisation Log */}
              <div style={{ padding:"8px 12px", borderBottom:"1px solid #E0E4EB" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#B8860B", marginBottom:6 }}>SECTION A — MONTHLY UTILISATION LOG (2024)</div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F7F8FC" }}>
                      {["MONTH","FH","FC","APU-H","FH/DAY","FC/DAY","AVG SECTOR","STATUS"].map(h => (
                        <th key={h} style={{ padding:"6px 7px", fontSize:8.5, color:"#6B7FA0", fontWeight:700, textAlign: h==="MONTH"?"left":"right", textTransform:"uppercase", borderBottom:"2px solid #D0D5E0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {UTIL_LOG.map((row, i) => (
                      <tr key={row.month} style={{ background: i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5" }}>
                        <td style={{ padding:"5px 7px", fontSize:10.5, fontWeight:700, color:"#1A3A5C" }}>{row.month}</td>
                        {[row.fh,row.fc,row.apu,row.fhDay,row.fcDay,row.sector].map((v,j)=>(
                          <td key={j} style={{ padding:"5px 7px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", color: utilLogReady ? "#2C3E50" : "#C8D0DA" }}>
                            {utilLogReady ? v : "—"}
                          </td>
                        ))}
                        <td style={{ padding:"5px 7px", textAlign:"right" }}>
                          {utilLogReady ? <StatusBadge s={row.status}/> : <span style={{ color:"#B0BEC5", fontSize:9 }}>PENDING</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Utilisation Audit Questions */}
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F7F8FC" }}>
                    {["REF","AUDIT QUESTION","EXPECTED","ACTUAL","SOURCE DOCUMENT","STATUS"].map(h => (
                      <th key={h} style={{ padding:"7px 8px", fontSize:8.5, color:"#5D8BAD", fontWeight:700, textAlign:"left", textTransform:"uppercase", borderBottom:"2px solid #1E3A5F",
                        width: h==="REF"?"5%":h==="AUDIT QUESTION"?"30%":h==="EXPECTED"?"18%":h==="ACTUAL"?"22%":h==="SOURCE DOCUMENT"?"14%":"11%" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {UTIL_QUESTIONS.map((row, i) => {
                    if (row.section) return (
                      <tr key={`sec-${i}`} style={{ background:"#F0F2F8" }}>
                        <td colSpan={6} style={{ padding:"8px 10px", fontSize:10, fontWeight:800, color:"#B8860B" }}>{row.section}</td>
                      </tr>
                    );
                    const filled = filledRows.has(row.ref);
                    const active = pulseRow === row.ref;
                    return (
                      <tr key={row.ref} style={{ background: active ? "#FFFDE7" : i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5" }}>
                        <td style={{ padding:"6px 8px", fontSize:10, color:"#B8860B", fontFamily:"monospace", fontWeight:700 }}>{row.ref}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#1A3A5C", lineHeight:1.35 }}>{row.q}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#4A6A8A" }}>{row.expected}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, fontWeight:filled?600:400, color: active?"#B8860B":filled?(row.status==="PASS"?"#0E8345":"#D4700A"):"#C8D0DA" }}>
                          {filled ? row.actual : "—"}{active && <span style={{ marginLeft:5, color:"#F0C040", fontSize:9, animation:"blink .8s infinite" }}>●</span>}
                        </td>
                        <td style={{ padding:"6px 8px", fontSize:10, color:filled?"#4A6A8A":"#C8D0DA", fontFamily:"monospace" }}>{filled ? row.source : "—"}</td>
                        <td style={{ padding:"6px 8px" }}>{filled ? <StatusBadge s={row.status}/> : <span style={{ color:"#B0BEC5", fontSize:9 }}>PENDING</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─ Financial Reconciliation Tab ────────────────────────────── */}
          <div style={{ display: activeTab === "finrecon" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflow:"auto" }}>
              <div style={{ padding:"7px 12px", background:"#F0F2F8", borderBottom:"1px solid #E0E4EB", fontSize:10.5, color:"#6B7FA0" }}>
                <b style={{ color:"#1A3A5C" }}>Financial Reconciliation — P&L</b> &nbsp;— SPV: Arx SPV III (Ireland) Ltd | Period: Jan 2025
              </div>

              {/* P&L Income Statement */}
              <div style={{ padding:"8px 12px", borderBottom:"1px solid #E0E4EB" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#B8860B", marginBottom:6 }}>SECTION A — INCOME STATEMENT (JAN 2025)</div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"#F7F8FC" }}>
                      {["LINE ITEM","SCHEDULED","ACTUAL","VARIANCE","STATUS"].map(h => (
                        <th key={h} style={{ padding:"6px 8px", fontSize:8.5, color:"#6B7FA0", fontWeight:700, textAlign: h==="LINE ITEM"?"left":"right", textTransform:"uppercase", borderBottom:"2px solid #D0D5E0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income header */}
                    <tr style={{ background:"#F0F8F0" }}>
                      <td colSpan={5} style={{ padding:"6px 8px", fontSize:10, fontWeight:800, color:"#0E8345" }}>INCOME</td>
                    </tr>
                    {PNL_DATA.filter(r=>r.type==="income").map((row,i)=>(
                      <tr key={row.item} style={{ background:i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5" }}>
                        <td style={{ padding:"5px 8px", fontSize:10.5, color:"#1A3A5C", paddingLeft:18 }}>{row.item}</td>
                        <td style={{ padding:"5px 8px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", color: finReconReady?"#4A6A8A":"#C8D0DA" }}>
                          {finReconReady ? `$${row.scheduled.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding:"5px 8px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", fontWeight:700, color: finReconReady?"#0E8345":"#C8D0DA" }}>
                          {finReconReady ? `$${row.actual.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding:"5px 8px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", color: finReconReady ? (row.actual-row.scheduled===0?"#8A9AB5":"#D4700A") : "#C8D0DA" }}>
                          {finReconReady ? `$${(row.actual-row.scheduled).toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding:"5px 8px", textAlign:"right" }}>
                          {finReconReady && row.actual > 0 ? <StatusBadge s="PASS"/> : finReconReady ? <span style={{color:"#8A9AB5",fontSize:9}}>N/A</span> : <span style={{color:"#B0BEC5",fontSize:9}}>PENDING</span>}
                        </td>
                      </tr>
                    ))}
                    {/* Expense header */}
                    <tr style={{ background:"#FFF5F5" }}>
                      <td colSpan={5} style={{ padding:"6px 8px", fontSize:10, fontWeight:800, color:"#D32F2F" }}>EXPENSES</td>
                    </tr>
                    {PNL_DATA.filter(r=>r.type==="expense").map((row,i)=>(
                      <tr key={row.item} style={{ background:i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5" }}>
                        <td style={{ padding:"5px 8px", fontSize:10.5, color:"#1A3A5C", paddingLeft:18 }}>{row.item}</td>
                        <td style={{ padding:"5px 8px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", color: finReconReady?"#4A6A8A":"#C8D0DA" }}>
                          {finReconReady ? `$${row.scheduled.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding:"5px 8px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", fontWeight:700, color: finReconReady?"#D32F2F":"#C8D0DA" }}>
                          {finReconReady ? `$${row.actual.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding:"5px 8px", fontSize:10.5, textAlign:"right", fontFamily:"monospace", color:"#8A9AB5" }}>
                          {finReconReady ? "$0" : "—"}
                        </td>
                        <td style={{ padding:"5px 8px", textAlign:"right" }}>
                          {finReconReady ? <StatusBadge s={row.item==="SPV Management Fee"?"REVIEW":"PASS"}/> : <span style={{color:"#B0BEC5",fontSize:9}}>PENDING</span>}
                        </td>
                      </tr>
                    ))}
                    {/* Net Profit */}
                    {finReconReady && (
                      <tr style={{ background:"#F0F2F8", borderTop:"2px solid #D0D5E0" }}>
                        <td style={{ padding:"8px 8px", fontSize:11.5, fontWeight:800, color:"#B8860B" }}>NET PROFIT</td>
                        <td style={{ padding:"8px 8px", fontSize:12, fontWeight:800, textAlign:"right", color:"#4A6A8A", fontFamily:"monospace" }}>$341,119</td>
                        <td style={{ padding:"8px 8px", fontSize:12, fontWeight:800, textAlign:"right", color:"#0E8345", fontFamily:"monospace" }}>$341,161</td>
                        <td style={{ padding:"8px 8px", fontSize:11, textAlign:"right", color:"#D4700A", fontFamily:"monospace" }}>+$42</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recon Audit Questions */}
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F7F8FC" }}>
                    {["REF","AUDIT QUESTION","EXPECTED","ACTUAL","SOURCE DOCUMENT","STATUS"].map(h => (
                      <th key={h} style={{ padding:"7px 8px", fontSize:8.5, color:"#5D8BAD", fontWeight:700, textAlign:"left", textTransform:"uppercase", borderBottom:"2px solid #1E3A5F",
                        width: h==="REF"?"5%":h==="AUDIT QUESTION"?"30%":h==="EXPECTED"?"18%":h==="ACTUAL"?"22%":h==="SOURCE DOCUMENT"?"14%":"11%" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FINRECON_QUESTIONS.map((row, i) => {
                    if (row.section) return (
                      <tr key={`sec-${i}`} style={{ background:"#F0F2F8" }}>
                        <td colSpan={6} style={{ padding:"8px 10px", fontSize:10, fontWeight:800, color:"#B8860B" }}>{row.section}</td>
                      </tr>
                    );
                    const filled = filledRows.has(row.ref);
                    const active = pulseRow === row.ref;
                    return (
                      <tr key={row.ref} style={{ background: active?"rgba(240,192,64,.08)":i%2===0?"#FFFFFF":"#F9FAFB", borderBottom:"1px solid #EDF0F5" }}>
                        <td style={{ padding:"6px 8px", fontSize:10, color:"#B8860B", fontFamily:"monospace", fontWeight:700 }}>{row.ref}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#1A3A5C", lineHeight:1.35 }}>{row.q}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, color:"#4A6A8A" }}>{row.expected}</td>
                        <td style={{ padding:"6px 8px", fontSize:10.5, fontWeight:filled?600:400, color: active?"#B8860B":filled?"#0E8345":"#C8D0DA" }}>
                          {filled ? row.actual : "—"}{active && <span style={{ marginLeft:5, color:"#F0C040", fontSize:9, animation:"blink .8s infinite" }}>●</span>}
                        </td>
                        <td style={{ padding:"6px 8px", fontSize:10, color:filled?"#4A6A8A":"#C8D0DA", fontFamily:"monospace" }}>{filled ? row.source : "—"}</td>
                        <td style={{ padding:"6px 8px" }}>{filled ? <StatusBadge s={row.status}/> : <span style={{ color:"#B0BEC5", fontSize:9 }}>PENDING</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─ Bank Recon Tab ──────────────────────────────────────────── */}
          <div style={{ display: activeTab === "bank" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"7px 12px", background:"#F0F2F8", borderBottom:"1px solid #E0E4EB", fontSize:10.5, color:"#6B7FA0",
                display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                <span><b style={{ color:"#1A3A5C" }}>FY2024 Bank Reconciliation</b> — Collections Account</span>
                <span style={{ color:"#F0C040", fontWeight:600 }}>
                  {bankReady ? "152 matched · 1 exception" : `${txCount}/152...`}
                </span>
              </div>
              {!bankReady ? (
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, color:"#8A9AB5" }}>
                  <div style={{ fontSize:34 }}>🏦</div>
                  <div style={{ fontSize:13 }}>Processing {txCount} transactions...</div>
                  <div style={{ width:220, height:5, background:"#E0E4EB", borderRadius:3 }}>
                    <div style={{ height:"100%", width:`${(txCount/152)*100}%`, background:"linear-gradient(90deg,#2E86C1,#5DADE2)", transition:"width .1s", borderRadius:3 }} />
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"#E0E4EB", flexShrink:0 }}>
                    {[
                      ["Rent Received",`$${(totalRent/1e6).toFixed(2)}M`,"#27AE60"],
                      ["MR In",`$${(totalMR/1e6).toFixed(2)}M`,"#2E86C1"],
                      ["Loan Interest",`$${(totalInt/1e6).toFixed(2)}M`,"#CB4335"],
                      ["Principal",`$${(totalPrinc/1e3).toFixed(0)}K`,"#BA4A00"],
                    ].map(([l,v,c]) => (
                      <div key={l} style={{ background:"#FFFFFF", padding:"9px 12px" }}>
                        <div style={{ fontSize:9.5, color:"#6B7FA0" }}>{l}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:c, marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflow:"auto", flex:1 }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ background:"#F7F8FC", position:"sticky", top:0 }}>
                          {["Month","Base Rent","MR Contrib","Loan Interest","Principal","Status"].map(h => (
                            <th key={h} style={{ padding:"7px 10px", fontSize:9, color:"#6B7FA0", fontWeight:700, textAlign: h==="Month"?"left":"right", textTransform:"uppercase", borderBottom:"2px solid #D0D5E0" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {BANK_DATA.map((row, i) => {
                          const ex = row.status === "exception";
                          return (
                            <tr key={row.month} style={{ background: ex ? "rgba(230,126,34,.06)" : (i%2===0?"#FFFFFF":"#F9FAFB"), borderBottom:"1px solid #EDF0F5" }}>
                              <td style={{ padding:"7px 10px", fontSize:11.5, fontWeight:700, color: ex ? "#D4700A":"#1A3A5C" }}>{row.month}-24</td>
                              {[row.rent,row.mr,row.interest,row.principal].map((v,j)=>(
                                <td key={j} style={{ padding:"7px 10px", fontSize:11.5, textAlign:"right", fontFamily:"monospace", color: j>=2 ? "#D32F2F":"#0E8345" }}>
                                  ${v.toLocaleString()}
                                </td>
                              ))}
                              <td style={{ padding:"7px 10px", textAlign:"right" }}>
                                {ex
                                  ? <span style={{ background:"rgba(230,126,34,.18)", color:"#E67E22", padding:"2px 8px", borderRadius:10, fontSize:9.5, fontWeight:700 }}>⚠ EXCEPTION</span>
                                  : <span style={{ background:"rgba(39,174,96,.12)", color:"#27AE60", padding:"2px 8px", borderRadius:10, fontSize:9.5, fontWeight:700 }}>✓ MATCHED</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─ Exception Tracker Tab ───────────────────────────────────── */}
          <div style={{ display: activeTab === "exceptions" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflow:"auto" }}>
              <div style={{ padding:"7px 12px", background:"#F0F2F8", borderBottom:"1px solid #E0E4EB", fontSize:10.5, color:"#6B7FA0" }}>
                <b style={{ color:"#1A3A5C" }}>Audit Exception Tracker</b> — 7 exceptions across all categories
              </div>
              {!excReady ? (
                <div style={{ padding:50, textAlign:"center", color:"#8A9AB5" }}>⏳ Running exception analysis...</div>
              ) : EXCEPTIONS.map((ex, idx) => {
                const sc  = ex.sev==="HIGH"?"#E74C3C": ex.sev==="MEDIUM"?"#E67E22":"#2E86C1";
                const stc = ex.status==="CLOSED"?"#27AE60":"#E67E22";
                return (
                  <div key={ex.id} style={{ margin:"8px 12px", borderRadius:7, border:`1px solid ${sc}28`, borderLeft:`3px solid ${sc}`, background:"#FFFFFF", boxShadow:"0 1px 3px rgba(0,0,0,.06)" }}>
                    <div style={{ padding:"8px 12px", display:"flex", gap:8, alignItems:"center", borderBottom:"1px solid #EDF0F5", flexWrap:"wrap", rowGap:4 }}>
                      <b style={{ color:"#B8860B", fontFamily:"monospace", fontSize:11 }}>{ex.id}</b>
                      <span style={{ background:`${sc}22`, color:sc, padding:"2px 7px", borderRadius:9, fontSize:9, fontWeight:700 }}>{ex.sev}</span>
                      <span style={{ background:"#EBF2FA", color:"#1A5276", padding:"2px 7px", borderRadius:9, fontSize:9, fontFamily:"monospace" }}>{ex.auditRef}</span>
                      <span style={{ background:"#EBF2FA", color:"#4A6A8A", padding:"2px 7px", borderRadius:9, fontSize:9 }}>{ex.cat}</span>
                      <span style={{ marginLeft:"auto", background:`${stc}18`, color:stc, padding:"2px 9px", borderRadius:9, fontSize:9, fontWeight:700 }}>
                        {ex.status==="CLOSED"?"✓ CLOSED":"● OPEN"}
                      </span>
                    </div>
                    <div style={{ padding:"8px 12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <div style={{ fontSize:8.5, color:"#8A9AB5", marginBottom:2, fontWeight:700, textTransform:"uppercase" }}>Description</div>
                        <div style={{ fontSize:10.5, color:"#2C3E50", lineHeight:1.4 }}>{ex.desc}</div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                        <div>
                          <div style={{ fontSize:8.5, color:"#8A9AB5", marginBottom:2, fontWeight:700, textTransform:"uppercase" }}>Owner</div>
                          <div style={{ fontSize:10.5, color:"#1A3A5C", fontWeight:600 }}>{ex.owner}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:8.5, color:"#8A9AB5", marginBottom:2, fontWeight:700, textTransform:"uppercase" }}>Target Date</div>
                          <div style={{ fontSize:10.5, color:"#B8860B", fontFamily:"monospace" }}>{ex.target}</div>
                        </div>
                        <div style={{ gridColumn:"span 2" }}>
                          <div style={{ fontSize:8.5, color:"#8A9AB5", marginBottom:2, fontWeight:700, textTransform:"uppercase" }}>Resolution Notes</div>
                          <div style={{ fontSize:10, color:"#4A6A8A", lineHeight:1.35 }}>{ex.resolution}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─ P&L Dashboard Tab ───────────────────────────────────────── */}
          <div style={{ display: activeTab === "pnl" ? "flex" : "none", flex:1, flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflow:"auto", padding:12 }}>
              {!pnlReady ? (
                <div style={{ padding:50, textAlign:"center", color:"#8A9AB5" }}>⏳ Calculating P&L Dashboard...</div>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9, marginBottom:12 }}>
                    {[
                      ["Net Cashflow","$237,477","FY2024 surplus","#27AE60"],
                      ["Total Income","$7.18M","Rent + MR + Other","#2E86C1"],
                      ["DSCR","1.48×","✓ Min 1.20×","#27AE60"],
                      ["LTV","67.6%","✓ Max 75.0%","#27AE60"],
                    ].map(([l,v,s,c]) => (
                      <div key={l} style={{ background:"#FFFFFF", borderRadius:7, padding:"11px 12px", borderTop:`3px solid ${c}`, boxShadow:"0 1px 3px rgba(0,0,0,.06)", animation:"fadeUp .5s ease" }}>
                        <div style={{ fontSize:9.5, color:"#6B7FA0" }}>{l}</div>
                        <div style={{ fontSize:20, fontWeight:800, color:c, margin:"3px 0" }}>{v}</div>
                        <div style={{ fontSize:9.5, color:"#8A9AB5" }}>{s}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#FFFFFF", borderRadius:7, padding:12, marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:10.5, fontWeight:600, color:"#1A3A5C", marginBottom:9 }}>
                      Monthly Income — Base Rent + MR Contributions (FY2024)
                    </div>
                    <ResponsiveContainer width="100%" height={145}>
                      <BarChart data={BANK_DATA} barSize={15} barGap={2}>
                        <XAxis dataKey="month" tick={{ fontSize:9, fill:"#6B7FA0" }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize:9, fill:"#6B7FA0" }} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
                        <Tooltip contentStyle={{ background:"#FFFFFF", border:"1px solid #D0D5E0", borderRadius:6, fontSize:11, color:"#1A3A5C" }} labelStyle={{ color:"#B8860B" }}
                          formatter={(v,n) => [`$${v.toLocaleString()}`, n==="rent"?"Base Rent":"MR Contrib"]} />
                        <Bar dataKey="rent" stackId="a" fill="#1A5276" name="rent"/>
                        <Bar dataKey="mr" stackId="a" name="mr" radius={[3,3,0,0]}>
                          {BANK_DATA.map((e,i) => (<Cell key={i} fill={e.status==="exception"?"#B8860B":"#0E6655"}/>))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background:"#FFFFFF", borderRadius:7, padding:12, marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:10.5, fontWeight:600, color:"#1A3A5C", marginBottom:10 }}>
                      FY2024 Cash Waterfall — Collections Account
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(9,1fr)", gap:3, alignItems:"end", height:95 }}>
                      {WATERFALL.map((item, i) => {
                        const h = Math.max(10, Math.round(item.val/5000000*88));
                        const c = item.type==="total"?"#1A5276":item.type==="positive"?"#0E6655":"#7B241C";
                        return (
                          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                            <div style={{ fontSize:7.5, color:"#5D8BAD", textAlign:"center", fontFamily:"monospace" }}>${(item.val/1e6).toFixed(1)}M</div>
                            <div style={{ width:"100%", height:h, background:c, borderRadius:"3px 3px 0 0", minHeight:8, opacity:item.type==="negative"?.8:1, animation:`fadeUp .5s ease ${i*.05}s both` }}/>
                            <div style={{ fontSize:7.5, color:"#8A9AB5", textAlign:"center", lineHeight:"1.1" }}>{item.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ background:"#FFFFFF", borderRadius:7, padding:12, boxShadow:"0 1px 3px rgba(0,0,0,.06)" }}>
                    <div style={{ fontSize:10.5, fontWeight:600, color:"#1A3A5C", marginBottom:9 }}>
                      Financial Covenant Compliance — FY2024
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #E0E4EB" }}>
                          {["Covenant","Actual","Threshold","Status"].map(h=>(
                            <th key={h} style={{ padding:"6px 9px", fontSize:9, color:"#6B7FA0", fontWeight:700, textAlign: h==="Actual"||h==="Threshold"?"center":"left", textTransform:"uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["DSCR (Debt Service Coverage)","1.48×","≥ 1.20×","✓ COMPLIANT","#27AE60"],
                          ["LTV (Loan-to-Value)","67.6%","≤ 75.0%","✓ COMPLIANT","#27AE60"],
                          ["Minimum Liquidity","$3.15M","≥ $2.00M","✓ COMPLIANT","#27AE60"],
                          ["Net Worth","$7.82M","≥ $5.0M","✓ COMPLIANT","#27AE60"],
                        ].map(([cov,actual,thresh,status,c],i)=>(
                          <tr key={cov} style={{ borderBottom:"1px solid #EDF0F5", background:i%2===0?"#F9FAFB":"#FFFFFF" }}>
                            <td style={{ padding:"7px 9px", fontSize:11.5, color:"#1A3A5C", fontWeight:600 }}>{cov}</td>
                            <td style={{ padding:"7px 9px", fontSize:11.5, textAlign:"center", color:"#2C3E50", fontFamily:"monospace", fontWeight:700 }}>{actual}</td>
                            <td style={{ padding:"7px 9px", fontSize:11.5, textAlign:"center", color:"#6B7FA0", fontFamily:"monospace" }}>{thresh}</td>
                            <td style={{ padding:"7px 9px" }}>
                              <span style={{ background:`${c}18`, color:c, padding:"3px 9px", borderRadius:10, fontSize:9.5, fontWeight:700 }}>{status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══ AGENT PANEL ═══════════════════════════════════════════════════ */}
        <div style={{ width:310, display:"flex", flexDirection:"column", background:"#0C1E33", flexShrink:0 }}>

          {/* Agent Header */}
          <div style={{ padding:"8px 13px", background:"#0B1929", borderBottom:"1px solid #152840", display:"flex", alignItems:"center", gap:9 }}>
            <span style={{ fontSize:17 }}>🤖</span>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700 }}>SPV AI Audit Engine</div>
              <div style={{ fontSize:8.5, color:"#3A5A7A" }}>
                claude-sonnet-4-6 &nbsp;|&nbsp; Aviation Audit Mode
              </div>
            </div>
            <div style={{ marginLeft:"auto" }}>
              {phase===1 && <div style={{ width:13, height:13, border:"2px solid #F0C040", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>}
              {phase===2 && <span style={{ fontSize:17 }}>✅</span>}
              {phase===0 && <span style={{ fontSize:15, color:"#2A4060" }}>💤</span>}
            </div>
          </div>

          {/* Document folder */}
          <div style={{ padding:"7px 13px", borderBottom:"1px solid #152840" }}>
            <div style={{ fontSize:9.5, color:"#3A5A7A", marginBottom:5, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", display:"flex", justifyContent:"space-between" }}>
              <span>Aircraft Document Folder</span>
              <span style={{ color:"#F0C040" }}>{docsScanned.length}/{DOCUMENTS.length} scanned</span>
            </div>
            <div style={{ background:"#0B1929", border:"1px solid #1C3A5C", borderRadius:5, padding:"5px 7px", maxHeight:120, overflowY:"auto" }}>
              {DOCUMENTS.map(doc => {
                const sc = docsScanned.includes(doc.name);
                return (
                  <div key={doc.name} className="doc-row" style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0", borderBottom:"1px solid #0F2035", fontSize:9.5, color: sc ? "#27AE60" : "#3A5A7A" }}>
                    <span style={{ flexShrink:0, fontSize:10 }}>{sc ? "✓" : "○"}</span>
                    <Badge type={doc.type}/>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:9, flex:1 }}>
                      {doc.name.replace(".pdf","").replace(".xlsx","").replace(/_/g," ")}
                    </span>
                    <span style={{ fontSize:8.5, color:"#2A4A6A", flexShrink:0 }}>{doc.size}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div style={{ padding:"7px 13px", borderBottom:"1px solid #152840" }}>
            <div style={{ fontSize:9.5, color:"#3A5A7A", marginBottom:3, fontWeight:700,
              textTransform:"uppercase", letterSpacing:".4px" }}>Agent Prompt</div>
            <div style={{ background:"#0B1929", border:"1px solid #1C3A5C",
              borderRadius:5, padding:"5px 10px", fontSize:10.5, color:"#7BAAD4", lineHeight:1.45 }}>
              Read all client documents and complete the full SPV audit workbook — assess all 207 questions across 8 categories
            </div>
          </div>

          {/* Uploaded Files */}
          <div style={{ padding:"7px 13px", borderBottom:"1px solid #152840" }}>
            <div style={{ fontSize:9.5, color:"#3A5A7A", marginBottom:3, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", display:"flex", justifyContent:"space-between" }}>
              <span>📎 Uploaded Files</span>
              <span style={{ color:"#F0C040" }}>{DOCUMENTS.length} files</span>
            </div>
            <div style={{ background:"#0B1929", border:"1px solid #1C3A5C", borderRadius:5, padding:"4px 7px", maxHeight:75, overflowY:"auto" }}>
              {DOCUMENTS.map(doc => (
                <div key={doc.name} style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 0", fontSize:8.5, color:"#5D8BAD", borderBottom:"1px solid #0F2035" }}>
                  <span style={{ color:"#F0C040", flexShrink:0 }}>{doc.name.endsWith(".xlsx") ? "📊" : "📄"}</span>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{doc.name}</span>
                  <span style={{ color:"#2A4A6A", flexShrink:0 }}>{doc.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo badge */}
          <div style={{ padding:"5px 13px", borderBottom:"1px solid #152840", background:"rgba(184,134,11,.07)", display:"flex", gap:7, alignItems:"center" }}>
            <span style={{ fontSize:12 }}>🎬</span>
            <div>
              <div style={{ fontSize:9, color:"#F0C040", fontWeight:700 }}>DEMO MODE — No API key required</div>
              <div style={{ fontSize:8.5, color:"#7B6020" }}>Realistic simulated streaming</div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ padding:"7px 13px", borderBottom:"1px solid #152840", display:"flex", gap:7 }}>
            <button onClick={phase===1 ? undefined : runDemo} disabled={phase===1}
              className="run-btn"
              style={{ flex:1, padding:"9px 0", border:"none", borderRadius:6,
                cursor: phase===1 ? "not-allowed":"pointer",
                background: phase===1 ? "#1E3A5F" : phase===2 ? "#0E6655"
                  : "linear-gradient(135deg,#B8860B 0%,#D4A017 100%)",
                color: phase===1 ? "#3A5A7A":"#0B1929",
                fontSize:12, fontWeight:800, letterSpacing:".3px",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {phase===1 ? (
                <>
                  <div style={{ width:11, height:11, border:"2px solid #3A5A7A", borderTopColor:"#7BAAD4", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
                  Running...
                </>
              ) : phase===2 ? "▶  Run Again" : "▶  Run Demo"}
            </button>
            {phase > 0 && (
              <button onClick={reset}
                style={{ padding:"9px 12px", background:"#142030", border:"1px solid #1C3A5C", borderRadius:6, color:"#5D8BAD", fontSize:11, cursor:"pointer", fontWeight:600 }}>
                Reset
              </button>
            )}
          </div>

          {/* Log */}
          <div ref={logRef} style={{ flex:1, overflow:"auto", padding:"7px 13px", fontFamily:"monospace", fontSize:9.5, lineHeight:1.9 }}>
            {agentLog.map(line => {
              if (line.type === "blank") return <div key={line.id} style={{ height:4 }}/>;
              const c = logClr[line.type] || "#7BAAD4";
              return (
                <div key={line.id} style={{ color:c, animation:"fadeUp .2s ease" }}>
                  {line.type==="header" ? <b>{line.text}</b> : line.text}
                </div>
              );
            })}

            {streamText && !streamDone && (
              <div style={{ marginTop:7, padding:"8px 10px", background:"#0B1929", borderRadius:5, border:"1px solid #1C3A5C", fontSize:9.5, color:"#7BAAD4", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                <div style={{ color:"#F0C040", fontSize:8.5, marginBottom:4, fontWeight:700 }}>
                  ◉ CLAUDE STREAMING — claude-sonnet-4-6
                </div>
                {streamText}
                <span style={{ color:"#F0C040", animation:"blink .7s infinite" }}>▋</span>
              </div>
            )}

            {phase===0 && agentLog.length===0 && (
              <div style={{ color:"#2A4060", fontSize:10.5, textAlign:"center", marginTop:20, lineHeight:2.1 }}>
                Click <b style={{ color:"#F0C040" }}>▶ Run Demo</b> above<br/>
                <span style={{ fontSize:9.5, color:"#1A3050" }}>
                  10 docs → 207 audit questions<br/>
                  152 bank tx reconciled<br/>
                  7 exceptions tracked → P&L built
                </span>
              </div>
            )}
          </div>

          {/* Footer stat bar */}
          {phase===2 && (
            <div style={{ padding:"7px 13px", background:"#0B1929", borderTop:"1px solid #152840", display:"flex", justifyContent:"space-between", fontSize:9.5, color:"#3A5A7A", animation:"fadeUp .5s ease" }}>
              <span>⏱ ~50 sec</span>
              <span style={{ color:"#27AE60" }}>vs ~14 hrs manual</span>
              <span style={{ color:"#F0C040", fontWeight:700 }}>97% faster ↑</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
