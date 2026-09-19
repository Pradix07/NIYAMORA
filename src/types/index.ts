export type UserRole = 'COMPANY_USER' | 'REVIEWER' | 'INSPECTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: UserRole;
  avatarUrl?: string;
}

export type PackagingType = 
  | 'Stand-Up Pouch' 
  | 'Rigid Carton' 
  | 'Glass Bottle' 
  | 'Jar / Tub' 
  | 'Tin Can' 
  | 'Flexible Film';

export type ComplianceStatus = 'GOOD' | 'REVIEW' | 'ISSUE';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label: string;
}

export interface ArtworkVersion {
  id: string;
  productId: string;
  versionLabel: string; // e.g. "V01", "V02", "V03"
  createdAt: string;
  uploader: string;
  status: ComplianceStatus;
  issueCount: number;
  reviewCount: number;
  goodCount: number;
  notes: string;
  fileSize: string;
  dimensions: string;
}

export interface Finding {
  id: string;
  productId: string;
  versionId: string;
  ruleCode: string;
  ruleName: string;
  category: 'Net Quantity' | 'FSSAI / License' | 'Ingredients & Allergens' | 'Date Markings' | 'Nutritional Info' | 'Consumer Care' | 'Origin & Manufacturer';
  status: ComplianceStatus;
  foundValue: string;
  expectedRequirement: string;
  explanation: string;
  evidenceBox: BoundingBox;
  confidence: number; // e.g. 0.94 for 94%
  suggestedAction: string;
  officialSource: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: PackagingType;
  brand: string;
  latestVersion: string;
  status: ComplianceStatus;
  issueCount: number;
  reviewCount: number;
  goodCount: number;
  lastChecked: string;
  dimensions: string;
  netQuantity: string;
  licenseNumber?: string;
  description: string;
}

export interface ComplianceRule {
  id: string;
  code: string;
  name: string;
  category: string;
  officialSource: string;
  sourceDate: string;
  applicability: string;
  howWeCheck: string;
  evidenceRequired: string;
  passCondition: string;
  issueCondition: string;
  reviewCondition: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
}

export interface ReviewItem {
  id: string;
  findingId: string;
  productId: string;
  productName: string;
  versionLabel: string;
  category: string;
  requirementName: string;
  confidence: number;
  reasonForReview: string;
  foundValue: string;
  status: 'PENDING' | 'CONFIRMED_ISSUE' | 'APPROVED_PASS' | 'NEW_IMAGE_REQUESTED';
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ComparisonDetail {
  category: string;
  field: string;
  statusA: ComplianceStatus;
  statusB: ComplianceStatus;
  changeType: 'Fixed' | 'Improved' | 'Unchanged' | 'New Issue';
  detail: string;
}

export interface ComparisonRecord {
  id: string;
  productId: string;
  productName: string;
  versionA: string;
  versionB: string;
  date: string;
  fixedCount: number;
  improvedCount: number;
  unchangedCount: number;
  newIssueCount: number;
  details: ComparisonDetail[];
}

export interface SuggestedDesignChange {
  id: string;
  element: string;
  issueDescription: string;
  originalSpec: string;
  suggestedSpec: string;
  status: 'Fixed' | 'Improved' | 'Unchanged' | 'New Issue';
  rationale: string;
}

export interface ReportRecord {
  id: string;
  title: string;
  type: 'Compliance Report' | 'Suggested Design' | 'Comparison Report' | 'Evidence Report' | 'Review Report';
  productId: string;
  productName: string;
  version: string;
  date: string;
  status: 'PASSED' | 'ACTION_REQUIRED' | 'UNDER_REVIEW';
  fileSize: string;
  format: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  productName: string;
  version: string;
  user: string;
  type: 'check' | 'improve' | 'review' | 'export' | 'version';
}
