/**
 * Common Prefill Mapper
 * 
 * Maps common fields that appear across all document types:
 * - Company details (legal name, ABN, address, email, phone)
 * - Client details (name, email, phone, billing address)
 * - Job details (ID, title, site address, summary)
 * - Date fields (dateIssued defaults to today)
 */

import type { JobData } from "../types";
import type { SafeUser } from "@/lib/auth";

export interface CompanyData {
  legalName?: string;
  abn?: string;
  address?: string;
  email?: string;
  phone?: string;
  bsb?: string;
  accountNumber?: string;
}

export interface ClientData {
  name?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
}

export interface CommonPrefillData {
  // Company
  companyLegalName?: string;
  companyABN?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyBSB?: string;
  companyAccountNumber?: string;
  
  // Client
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientBillingAddress?: string;
  
  // Job
  jobId?: string;
  jobTitle?: string;
  siteAddress?: string;
  jobSummary?: string;
  tradeType?: string;
  propertyType?: string;
  
  // Dates
  dateIssued?: string; // ISO date string, defaults to today
}

/**
 * Map common fields from job, user, and company/client data
 */
export function mapCommon(
  job: JobData,
  user: SafeUser | null,
  companyData?: CompanyData,
  clientData?: ClientData
): CommonPrefillData {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  return {
    // Company data (from Prisma User or companyData param)
    companyLegalName: companyData?.legalName || user?.businessDetails?.businessName || "",
    companyABN: companyData?.abn || user?.businessDetails?.abn || "",
    companyAddress: companyData?.address || user?.businessDetails?.serviceArea || "",
    companyEmail: companyData?.email || user?.email || "",
    companyPhone: companyData?.phone || "",
    companyBSB: companyData?.bsb || "",
    companyAccountNumber: companyData?.accountNumber || "",
    
    // Client data
    clientName: clientData?.name || job.clientName || "",
    clientEmail: clientData?.email || job.clientEmail || "",
    clientPhone: clientData?.phone || "",
    clientBillingAddress: clientData?.billingAddress || job.address || "",
    
    // Job data
    jobId: job.jobId || job.id || "",
    jobTitle: job.jobTitle || job.title || "",
    siteAddress: job.address || "",
    jobSummary: job.aiSummary || job.notes || "",
    tradeType: job.tradeType || "",
    propertyType: job.propertyType || "",
    
    // Dates
    dateIssued: today,
  };
}

