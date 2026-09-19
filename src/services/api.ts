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

  getFileUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  },
};
