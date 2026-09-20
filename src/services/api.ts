export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface ApiProduct {
  id: string;
  company_id: string;
  name: string;
  brand: string;
  category: string;
  packaging_type: string;
  sku: string;
  net_quantity: string;
  description?: string;
  created_at: string;
  updated_at: string;
  latest_version?: string;
  version_count?: number;
  inspection_count?: number;
}

export interface ApiUploadCheckResponse {
  success: boolean;
  product_id: string;
  product_name: string;
  artwork_id: string;
  version_id: string;
  version_number: number;
  version_label: string;
  inspection_id: string;
  inspection_status: string;
  quality_verdict?: string;
  storage_key: string;
  preview_url: string;
}

export interface ApiQualityReport {
  verdict: 'GOOD' | 'REVIEW' | 'POOR';
  score: number;
  estimated_dpi?: number;
  width: number;
  height: number;
  is_pdf: boolean;
  details: Array<{
    metric: string;
    value: any;
    verdict: string;
    message: string;
  }>;
  warnings: string[];
}

export interface ApiExtractedField {
  field_key: string;
  field_name: string;
  extracted_value: string | null;
  status: 'EXTRACTED' | 'NOT_FOUND' | 'UNCERTAIN' | 'UNAVAILABLE';
  confidence?: number;
  evidence_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  };
  source?: string;
}

export interface ApiEvidence {
  id: string;
  inspection_id: string;
  source_type: string;
  panel_id?: string;
  page_number?: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  };
  observed_text?: string;
  extracted_value?: string;
  evidence_quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';
  created_at: string;
}

export interface ApiEvaluation {
  id: string;
  inspection_id: string;
  rule_version_id: string;
  rule_code: string;
  rule_title: string;
  source_reference: string;
  source_url?: string;
  status: 'PASS' | 'ISSUE' | 'REVIEW' | 'N/A';
  observed_value?: string;
  expected_condition: string;
  explanation: string;
  evidence_id?: string;
  evidence?: ApiEvidence;
  evaluated_at: string;
}

export interface ApiFinding {
  id: string;
  inspection_id: string;
  evaluation_id: string;
  rule_code: string;
  severity: 'CRITICAL' | 'MAJOR' | 'REVIEW';
  status: 'OPEN' | 'RESOLVED' | 'REVIEWED';
  title: string;
  summary: string;
  observed_value?: string;
  requirement: string;
  suggested_action: string;
  evidence_id?: string;
  evidence?: ApiEvidence;
  created_at: string;
}

export interface ApiRuleVersion {
  id: string;
  rule_id: string;
  rule_code: string;
  version_number: number;
  title: string;
  requirement_text: string;
  source_id: string;
  source_reference: string;
  source_url: string;
  effective_from: string;
  effective_to?: string;
  applicability: string;
  evaluation_type: string;
  parameters: Record<string, any>;
  status: string;
}

export interface ApiRule {
  id: string;
  domain: string;
  rule_code: string;
  title: string;
  category: string;
  severity: string;
  description?: string;
  is_active: boolean;
  versions: ApiRuleVersion[];
}

export interface ApiHumanReview {
  id: string;
  inspection_id: string;
  finding_id?: string;
  reviewer_name: string;
  decision: string;
  notes?: string;
  created_at: string;
}

export interface ApiInspection {
  id: string;
  product_id: string;
  product_name: string;
  brand: string;
  artwork_version_id: string;
  version_label: string;
  original_filename: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_stage: string;
  quality_verdict?: 'GOOD' | 'REVIEW' | 'POOR';
  quality_score?: number;
  quality_details?: ApiQualityReport;
  extracted_data?: {
    raw_text: string;
    total_blocks: number;
    blocks: Array<{
      id: string;
      text: string;
      confidence?: number;
      bbox: [number, number, number, number];
      normalized_box: {
        x: number;
        y: number;
        width: number;
        height: number;
        label?: string;
      };
    }>;
    fields: Record<string, ApiExtractedField>;
    phase_note: string;
  };
  compliance_verdict?: 'PASS' | 'ISSUE' | 'REVIEW' | 'N/A';
  compliance_score?: number;
  findings_summary?: {
    total_rules: number;
    evaluable_rules: number;
    pass_count: number;
    issue_count: number;
    review_count: number;
    na_count: number;
    verdict: string;
    score: number;
    disclaimer: string;
  };
  preview_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// Phase 4 Interfaces
export interface ApiStructuredUSP {
  quantity_basis: string;
  quantity_value: number;
  quantity_unit: string;
  usp_basis: string;
  usp_value?: number;
  usp_unit: string;
  mrp_value?: number;
  rounding_rule?: string;
  rule_version?: string;
  applicability?: string;
  evaluation_status?: string;
  scope_note?: string;
}

export interface ApiSuggestedDesignChange {
  change_id: string;
  finding_id?: string;
  field_key: string;
  field_name: string;
  original_value?: string;
  suggested_value: string;
  original_location?: { x: number; y: number; width: number; height: number };
  suggested_location?: { x: number; y: number; width: number; height: number };
  original_style?: Record<string, any>;
  suggested_style?: Record<string, any>;
  reason: string;
  rule_code: string;
  rule_reference?: string;
  evidence_reference?: string;
  change_type: 'CORRECTION' | 'ADDITION' | 'REPOSITION' | 'REFORMAT' | 'REVIEW_REQUIRED';
  status: 'FIXED' | 'IMPROVED' | 'REVIEW' | 'REVIEW_REQUIRED';
  structured_usp?: ApiStructuredUSP | null;
}

export interface ApiSuggestedDesign {
  id: string;
  product_id: string;
  product_name?: string;
  source_artwork_version_id: string;
  source_inspection_id: string;
  suggested_artwork_version_id?: string;
  version_label: string;
  status: 'GENERATED' | 'RENDERED' | 'VERIFIED' | 'APPLIED';
  change_set: ApiSuggestedDesignChange[];
  rendered_artwork_reference?: string;
  preview_url?: string;
  source_preview_url?: string;
  validation_status: 'PENDING' | 'IMPROVED' | 'NO_CHANGE' | 'NEW_ISSUES_FOUND' | 'REVIEW_REQUIRED';
  validation_inspection_id?: string;
  report_reference?: string;
  created_by: string;
  created_at: string;
}

export interface ApiComparisonDetail {
  category: string;
  field: string;
  status_a: string;
  status_b: string;
  change_type: string;
  detail: string;
  rule_code: string;
}

export interface ApiComparisonResult {
  product_id: string;
  product_name: string;
  version_a_id: string;
  version_b_id: string;
  version_a_label: string;
  version_b_label: string;
  version_a_preview_url?: string;
  version_b_preview_url?: string;
  fixed_count: number;
  improved_count: number;
  unchanged_count: number;
  new_issue_count: number;
  review_count: number;
  version_a_summary?: Record<string, number>;
  version_b_summary?: Record<string, number>;
  details: ApiComparisonDetail[];
}

export interface ApiRegressionIssue {
  rule_code: string;
  field: string;
  description: string;
  old_status: string;
  new_status: string;
  severity: string;
  suggested_action?: string;
}

export interface ApiRegressionResult {
  product_id: string;
  product_name: string;
  comparison_title: string;
  version_a_label: string;
  version_b_label: string;
  regression_detected: boolean;
  regression_verdict: 'NO_REGRESSION' | 'REGRESSION_DETECTED' | 'IMPROVED';
  fixed_issues: ApiRegressionIssue[];
  new_issues_introduced: ApiRegressionIssue[];
  improved_issues: ApiRegressionIssue[];
  unchanged_issues: ApiRegressionIssue[];
  review_changed_issues?: ApiRegressionIssue[];
  version_a_summary?: Record<string, number>;
  version_b_summary?: Record<string, number>;
}

export interface ApiSimulationRequest {
  rule_code?: string;
  font_height_mm?: number;
  pack_weight_g?: number;
  pdp_area_sqcm?: number;
  packaging_type?: string;
  mrp?: string;
  unit_sale_price?: string;
  category?: string;
  date_str?: string;
}

export interface ApiSimulationResponse {
  rule_code: string;
  rule_title: string;
  source_reference: string;
  current_parameter: Record<string, any>;
  hypothetical_parameter: Record<string, any>;
  current_verdict: string;
  hypothetical_verdict: string;
  explanation: string;
  difference_label: string;
  threshold_matrix?: Array<{
    tier: string;
    min_numeral_mm?: number;
    min_letter_mm?: number;
    pdp_area?: string;
    rule?: string;
  }>;
}

export interface ApiRiskMapItem {
  id: string;
  category: string;
  field: string;
  rule_code: string;
  status?: string;
  density_level?: 'HIGH' | 'MEDIUM' | 'LOW';
  risk_level?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  risk_score?: number;
  bbox?: { x: number; y: number; width: number; height: number };
  finding_id?: string;
  explanation: string;
}

export interface ApiRiskMapResponse {
  product_id: string;
  inspection_id: string;
  total_findings?: number;
  issue_count?: number;
  review_count?: number;
  pass_count?: number;
  high_density_count?: number;
  medium_density_count?: number;
  low_density_count?: number;
  overall_risk_score?: number;
  high_risk_count?: number;
  medium_risk_count?: number;
  low_risk_count?: number;
  risk_items: ApiRiskMapItem[];
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getProducts(params?: { search?: string; packaging_type?: string }): Promise<ApiProduct[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.packaging_type && params.packaging_type !== 'ALL') {
      query.set('packaging_type', params.packaging_type);
    }
    const res = await fetch(`${API_BASE_URL}/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProduct(id: string): Promise<ApiProduct> {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  async createProduct(payload: {
    name: string;
    brand: string;
    sku: string;
    category?: string;
    packaging_type: string;
    net_quantity?: string;
    description?: string;
  }): Promise<ApiProduct> {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create product');
    }
    return res.json();
  },

  async uploadCheck(formData: FormData): Promise<ApiUploadCheckResponse> {
    const res = await fetch(`${API_BASE_URL}/api/upload-check`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload artwork');
    }
    return res.json();
  },

  async getInspections(): Promise<ApiInspection[]> {
    const res = await fetch(`${API_BASE_URL}/api/inspections`);
    if (!res.ok) throw new Error('Failed to fetch inspections');
    return res.json();
  },

  async getInspection(id: string): Promise<ApiInspection> {
    const res = await fetch(`${API_BASE_URL}/api/inspections/${id}`);
    if (!res.ok) throw new Error('Failed to fetch inspection');
    return res.json();
  },

  async getEvaluations(inspectionId: string): Promise<ApiEvaluation[]> {
    const res = await fetch(`${API_BASE_URL}/api/inspections/${inspectionId}/evaluations`);
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    return res.json();
  },

  async getFindings(inspectionId: string): Promise<ApiFinding[]> {
    const res = await fetch(`${API_BASE_URL}/api/inspections/${inspectionId}/findings`);
    if (!res.ok) throw new Error('Failed to fetch findings');
    return res.json();
  },

  async getRules(category?: string, search?: string): Promise<ApiRule[]> {
    const query = new URLSearchParams();
    if (category && category !== 'ALL') query.set('category', category);
    if (search) query.set('search', search);
    const res = await fetch(`${API_BASE_URL}/api/rules?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch rules');
    return res.json();
  },

  async submitReview(payload: {
    inspection_id?: string;
    finding_id?: string;
    reviewer_name?: string;
    decision: string;
    notes?: string;
  }): Promise<ApiHumanReview> {
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit review');
    }
    return res.json();
  },

  async getReviews(inspectionId?: string): Promise<ApiHumanReview[]> {
    const query = new URLSearchParams();
    if (inspectionId) query.set('inspection_id', inspectionId);
    const res = await fetch(`${API_BASE_URL}/api/reviews?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  // Phase 4 Suggested Design APIs
  async suggestDesign(productId: string, versionId: string): Promise<ApiSuggestedDesign> {
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/artworks/${versionId}/suggest`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate suggested design');
    }
    return res.json();
  },

  async getSuggestedDesign(id: string): Promise<ApiSuggestedDesign> {
    const res = await fetch(`${API_BASE_URL}/api/suggested-designs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch suggested design');
    return res.json();
  },

  async listSuggestedDesigns(productId?: string): Promise<ApiSuggestedDesign[]> {
    const query = new URLSearchParams();
    if (productId) query.set('product_id', productId);
    const res = await fetch(`${API_BASE_URL}/api/suggested-designs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to list suggested designs');
    return res.json();
  },

  async renderSuggestedDesign(id: string): Promise<ApiSuggestedDesign> {
    const res = await fetch(`${API_BASE_URL}/api/suggested-designs/${id}/render`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to render suggested design');
    return res.json();
  },

  async verifySuggestedDesign(id: string): Promise<ApiSuggestedDesign> {
    const res = await fetch(`${API_BASE_URL}/api/suggested-designs/${id}/verify`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to verify suggested design');
    return res.json();
  },

  getSuggestedDesignPdfUrl(id: string): string {
    return `${API_BASE_URL}/api/suggested-designs/${id}/pdf`;
  },

  // Phase 4 Comparison, Regression, Simulator & Risk Map APIs
  async compareVersions(productId: string, versionAId?: string, versionBId?: string): Promise<ApiComparisonResult> {
    const query = new URLSearchParams();
    if (versionAId) query.set('version_a_id', versionAId);
    if (versionBId) query.set('version_b_id', versionBId);
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/compare?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to compare versions');
    return res.json();
  },

  async getRegression(productId: string, versionAId?: string, versionBId?: string): Promise<ApiRegressionResult> {
    const query = new URLSearchParams();
    if (versionAId) query.set('version_a_id', versionAId);
    if (versionBId) query.set('version_b_id', versionBId);
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/regression?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch regression');
    return res.json();
  },

  async simulateRule(productId: string, payload: ApiSimulationRequest): Promise<ApiSimulationResponse> {
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to execute simulation');
    return res.json();
  },

  async getRiskMap(productId: string, inspectionId?: string): Promise<ApiRiskMapResponse> {
    const query = new URLSearchParams();
    if (inspectionId) query.set('inspection_id', inspectionId);
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}/risk-map?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch risk map');
    return res.json();
  },

  getFileUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  },
};
