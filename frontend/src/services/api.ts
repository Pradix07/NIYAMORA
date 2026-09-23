const getApiBaseUrl = (): string => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL;

  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return '';
  }
  return 'https://niyamora-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiUser {
  id: string;
  company_id: string;
  company_name?: string;
  name: string;
  email: string;
  role: 'COMPANY_USER' | 'REVIEWER' | 'INSPECTOR' | 'ADMIN';
  created_at: string;
}

export interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

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
    panel_type?: string;
    panel_id?: string;
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
    panel_type?: string;
    panel_id?: string;
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

export interface ApiRuleSource {
  id: string;
  title: string;
  issuing_authority: string;
  source_url: string;
  document_type: string;
  publication_date?: string;
  effective_date?: string;
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

export interface ApiPanel {
  id: string;
  panel_type: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type?: string;
  preview_url: string;
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
        panel_type?: string;
        panel_id?: string;
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
  };
  preview_url?: string;
  panels?: ApiPanel[];
  error_message?: string;
  created_at: string;
}

export interface ApiStructuredUSP {
  quantity_basis: 'MASS' | 'VOLUME' | 'LENGTH' | 'COUNT';
  quantity_value: number;
  quantity_unit: string;
  usp_basis: string;
  usp_value: number | null;
  usp_unit: string;
  mrp_value?: number | null;
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
  original_value: string;
  suggested_value: string;
  original_location: { x: number; y: number; width: number; height: number };
  suggested_location: { x: number; y: number; width: number; height: number };
  original_style?: Record<string, any>;
  suggested_style?: Record<string, any>;
  reason: string;
  rule_code: string;
  rule_reference?: string;
  evidence_reference?: string;
  change_type: 'SCALE' | 'REFORMAT' | 'ADDITION' | 'RELOCATE' | 'CORRECTION' | 'REVIEW_REQUIRED';
  status: 'FIXED' | 'IMPROVED' | 'REVIEW';
  target_panel?: string;
  original_panel?: string;
  structured_usp?: ApiStructuredUSP;
}

export interface ApiSuggestedDesign {
  id: string;
  product_id: string;
  source_version_id: string;
  target_version_id?: string;
  target_version_label?: string;
  version_label?: string;
  preview_url?: string;
  source_preview_url?: string;
  validation_status?: string;
  status?: string;
  change_count: number;
  change_set: ApiSuggestedDesignChange[];
  rendered_image_url?: string;
  rendered_pdf_url?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED';
  revalidation_inspection_id?: string;
  version_a_summary?: Record<string, number>;
  version_b_summary?: Record<string, number>;
  fixed_count?: number;
  new_issues_count?: number;
  review_changed_count?: number;
  disclaimer: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApiComparisonItem {
  field_key: string;
  field_name: string;
  rule_code: string;
  rule_title: string;
  source_reference?: string;
  version_a_status: 'PASS' | 'ISSUE' | 'REVIEW' | 'N/A' | 'NOT_EVALUATED';
  version_a_value: string;
  version_a_explanation?: string;
  version_b_status: 'PASS' | 'ISSUE' | 'REVIEW' | 'N/A' | 'NOT_EVALUATED';
  version_b_value: string;
  version_b_explanation?: string;
  transition: 'FIXED' | 'IMPROVED' | 'UNCHANGED' | 'NEW_ISSUE' | 'REVIEW_CHANGED' | 'UNCHANGED_REVIEW';
  is_regression: boolean;
  notes: string;
}

export interface ApiComparisonResult {
  product_id: string;
  product_name: string;
  version_a_id: string;
  version_a_label: string;
  version_b_id: string;
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
  details: Array<{
    category: string;
    field: string;
    status_a: string;
    status_b: string;
    change_type: string;
    detail: string;
    rule_code: string;
  }>;
}

export interface ApiRegressionItem {
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
  regression_verdict: string;
  fixed_issues: ApiRegressionItem[];
  new_issues_introduced: ApiRegressionItem[];
  improved_issues: ApiRegressionItem[];
  unchanged_issues: ApiRegressionItem[];
  review_changed_issues?: ApiRegressionItem[];
  version_a_summary?: Record<string, number>;
  version_b_summary?: Record<string, number>;
}

export interface ApiSimulationRequest {
  rule_code: string;
  pdp_area_cm2?: number;
  net_quantity_value?: number;
  net_quantity_unit?: string;
  mrp_value?: number;
  is_state_excise_liquor?: boolean;
  actual_character_height_mm?: number;
  custom_parameters?: Record<string, any>;
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
  threshold_matrix?: Array<Record<string, any>>;
}

export interface ApiRiskMapItem {
  id: string;
  category: string;
  field: string;
  rule_code: string;
  status: string;
  density_level: string;
  bbox?: { x: number; y: number; width: number; height: number };
  finding_id?: string;
  explanation: string;
}

export interface ApiRiskMapResponse {
  product_id: string;
  inspection_id: string;
  total_findings: number;
  issue_count: number;
  review_count: number;
  pass_count: number;
  high_density_count: number;
  medium_density_count: number;
  low_density_count: number;
  risk_items: ApiRiskMapItem[];
}

export interface ApiPassportVersion {
  version_id: string;
  version_number: number;
  version_label: string;
  storage_key: string;
  created_at: string;
  verification_status: string;
  source_type: string;
  file_hash?: string;
}

export interface ApiPassportInspection {
  inspection_id: string;
  version_label: string;
  status: string;
  created_at: string;
  completed_at?: string;
  pass_count: number;
  issue_count: number;
  review_count: number;
  na_count: number;
}

export interface ApiPassportResponse {
  product_id: string;
  product_name: string;
  brand: string;
  sku: string;
  category: string;
  packaging_type: string;
  net_quantity: string;
  created_at: string;
  versions: ApiPassportVersion[];
  inspections: ApiPassportInspection[];
  human_reviews: ApiHumanReview[];
  audit_events: Array<{
    id: string;
    event_type: string;
    actor_id: string;
    actor_role: string;
    entity_type: string;
    entity_id: string;
    details?: any;
    created_at: string;
  }>;
  disclaimer: string;
}

// Token management helpers
export const setAuthToken = (token: string) => {
  localStorage.setItem('niyamora_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('niyamora_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('niyamora_token');
  localStorage.removeItem('niyamora_user');
};

// Authenticated fetch helper
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // Network-level failure: backend unreachable, CORS preflight rejected, or connection timeout
    const isLocal = !API_BASE_URL || API_BASE_URL === '';
    const hint = isLocal
      ? 'Ensure the backend server is running on http://127.0.0.1:8000'
      : `Could not reach the backend at ${API_BASE_URL}. The server may be starting up (cold start) — please retry in 30 seconds.`;
    throw new Error(`Network error: ${hint}`);
  }

  if (res.status === 401) {
    // If unauthorized, clear stale token
    clearAuthToken();
  }

  return res;
}

export interface ApiPackagingProject {
  id: string;
  company_id: string;
  product_id?: string;
  artwork_id?: string;
  artwork_version_id?: string;
  inspection_id?: string;
  title: string;
  status: 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'APPROVED';
  packaging_format: string;
  dimensions: {
    width_mm?: number;
    height_mm?: number;
    depth_mm?: number;
    bleed_mm?: number;
  };
  product_data: {
    product_name?: string;
    brand_name?: string;
    category?: string;
    sub_category?: string;
    description?: string;
    net_quantity?: string;
    unit?: string;
  };
  business_data: {
    manufacturer_name?: string;
    manufacturer_address?: string;
    packer_name?: string;
    packer_address?: string;
    importer_name?: string;
    importer_address?: string;
    marketer_name?: string;
    marketer_address?: string;
    country_of_origin?: string;
    consumer_care_phone?: string;
    consumer_care_email?: string;
    consumer_care_website?: string;
    consumer_care_address?: string;
    fssai_license?: string;
  };
  food_data: {
    ingredients?: Array<{ name: string; percentage?: string }>;
    contains_allergens?: string[];
    may_contain_allergens?: string[];
    veg_non_veg?: 'VEG' | 'NON_VEG' | 'NOT_APPLICABLE';
  };
  nutrition_data: {
    basis?: string;
    serving_size?: string;
    nutrients?: Array<{ nutrient_name: string; amount: string; unit: string; rda_percentage?: string }>;
  };
  declaration_data: {
    mrp?: string;
    unit_sale_price?: string;
    batch_number?: string;
    mfg_date?: string;
    pack_date?: string;
    expiry_date?: string;
    best_before?: string;
    storage_instructions?: string;
    preparation_instructions?: string;
    user_claims?: string[];
    barcode?: string;
  };
  brand_data: {
    logo_url?: string;
    use_text_logo?: boolean;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    design_style?: string;
    custom_direction?: string;
  };
  design_brief: {
    summary?: string;
    style_theme?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    typography_notes?: string;
    hierarchy_notes?: string;
    custom_direction?: string;
  };
  panel_designs: Record<string, {
    panel_type: string;
    file_path: string;
    preview_url: string;
    width: number;
    height: number;
    elements: any[];
    is_applicable: boolean;
  }>;
  active_version_number: number;
  compliance_summary?: {
    score?: number;
    verdict?: string;
    findings_summary?: {
      pass_count?: number;
      issue_count?: number;
      review_count?: number;
      total?: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface ApiPackagingRedesignResponse {
  project_id: string;
  proposed_version_number: number;
  changes_summary: string[];
  style_overrides?: Record<string, any>;
  feedback_prompt: string;
}

export const api = {
  // Authentication
  async signup(payload: {
    name: string;
    email: string;
    company_name: string;
    password: string;
    role?: string;
  }): Promise<ApiTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to sign up');
    }
    const data: ApiTokenResponse = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
      localStorage.setItem('niyamora_user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(payload: { email: string; password: string }): Promise<ApiTokenResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Incorrect email or password');
    }
    const data: ApiTokenResponse = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
      localStorage.setItem('niyamora_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe(): Promise<ApiUser> {
    const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Authentication required');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await authFetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthToken();
    }
  },

  // Products
  async getProducts(search?: string, type?: string): Promise<ApiProduct[]> {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (type && type !== 'ALL') query.set('packaging_type', type);
    const res = await authFetch(`${API_BASE_URL}/api/products?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch products');
    }
    return res.json();
  },

  async getProduct(id: string): Promise<ApiProduct> {
    const res = await authFetch(`${API_BASE_URL}/api/products/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch product');
    }
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
    const res = await authFetch(`${API_BASE_URL}/api/products`, {
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

  async deleteProduct(id: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete product');
    }
  },

  // Inspection & Upload Check
  async uploadCheck(formData: FormData): Promise<ApiUploadCheckResponse> {
    const res = await authFetch(`${API_BASE_URL}/api/upload-check`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload artwork');
    }
    return res.json();
  },

  async getInspections(productId?: string): Promise<ApiInspection[]> {
    const query = new URLSearchParams();
    if (productId) query.set('product_id', productId);
    const res = await authFetch(`${API_BASE_URL}/api/inspections?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch inspections');
    }
    return res.json();
  },

  async getInspection(id: string): Promise<ApiInspection> {
    const res = await authFetch(`${API_BASE_URL}/api/inspections/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch inspection');
    }
    return res.json();
  },

  async getEvaluations(inspectionId: string): Promise<ApiEvaluation[]> {
    const res = await authFetch(`${API_BASE_URL}/api/inspections/${inspectionId}/evaluations`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch evaluations');
    }
    return res.json();
  },

  async getFindings(inspectionId: string): Promise<ApiFinding[]> {
    const res = await authFetch(`${API_BASE_URL}/api/inspections/${inspectionId}/findings`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch findings');
    }
    return res.json();
  },

  async getEvidence(inspectionId: string): Promise<ApiEvidence[]> {
    const res = await authFetch(`${API_BASE_URL}/api/inspections/${inspectionId}/evidence`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch evidence');
    }
    return res.json();
  },

  async getRules(category?: string, search?: string): Promise<ApiRule[]> {
    const query = new URLSearchParams();
    if (category && category !== 'ALL') query.set('category', category);
    if (search) query.set('search', search);
    const res = await authFetch(`${API_BASE_URL}/api/rules?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch rules');
    }
    return res.json();
  },

  async getRule(ruleIdOrCode: string): Promise<ApiRule> {
    const res = await authFetch(`${API_BASE_URL}/api/rules/${encodeURIComponent(ruleIdOrCode)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch rule');
    }
    return res.json();
  },

  async getRuleSources(): Promise<ApiRuleSource[]> {
    const res = await authFetch(`${API_BASE_URL}/api/rules/sources`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch rule sources');
    }
    return res.json();
  },

  // Human Review Workflow
  async submitReview(payload: {
    inspection_id?: string;
    finding_id?: string;
    reviewer_name?: string;
    decision: string;
    notes?: string;
  }): Promise<ApiHumanReview> {
    const res = await authFetch(`${API_BASE_URL}/api/reviews`, {
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
    const res = await authFetch(`${API_BASE_URL}/api/reviews?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch reviews');
    }
    return res.json();
  },

  // Phase 4 Suggested Design APIs
  async suggestDesign(productId: string, versionId: string): Promise<ApiSuggestedDesign> {
    const res = await authFetch(`${API_BASE_URL}/api/products/${productId}/artworks/${versionId}/suggest`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate suggested design');
    }
    return res.json();
  },

  async getSuggestedDesign(id: string): Promise<ApiSuggestedDesign> {
    const res = await authFetch(`${API_BASE_URL}/api/suggested-designs/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch suggested design');
    }
    return res.json();
  },

  async listSuggestedDesigns(productId?: string): Promise<ApiSuggestedDesign[]> {
    const query = new URLSearchParams();
    if (productId) query.set('product_id', productId);
    const res = await authFetch(`${API_BASE_URL}/api/suggested-designs?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to list suggested designs');
    }
    return res.json();
  },

  async renderSuggestedDesign(id: string): Promise<ApiSuggestedDesign> {
    const res = await authFetch(`${API_BASE_URL}/api/suggested-designs/${id}/render`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to render suggested design');
    }
    return res.json();
  },

  async verifySuggestedDesign(id: string): Promise<ApiSuggestedDesign> {
    const res = await authFetch(`${API_BASE_URL}/api/suggested-designs/${id}/verify`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to verify suggested design');
    }
    return res.json();
  },

  getSuggestedDesignPdfUrl(id: string): string {
    const token = localStorage.getItem('niyamora_token');
    const base = `${API_BASE_URL}/api/suggested-designs/${id}/pdf`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },

  getInspectionPdfUrl(id: string): string {
    const token = localStorage.getItem('niyamora_token');
    const base = `${API_BASE_URL}/api/inspections/${id}/pdf`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },

  async downloadInspectionPdf(id: string, customFilename?: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/api/inspections/${id}/pdf`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download inspection PDF report');
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition') || '';
    let filename = customFilename || 'NIYAMORA_Inspection_Report.pdf';
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  async downloadSuggestedDesignPdf(id: string, customFilename?: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/api/suggested-designs/${id}/pdf`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download suggested design PDF');
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition') || '';
    let filename = customFilename || 'NIYAMORA_Suggested_Design.pdf';
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  // Comparison, Regression, Simulator & Risk Map
  async compareVersions(productId: string, versionAId?: string, versionBId?: string): Promise<ApiComparisonResult> {
    const query = new URLSearchParams();
    if (versionAId) query.set('version_a_id', versionAId);
    if (versionBId) query.set('version_b_id', versionBId);
    const res = await authFetch(`${API_BASE_URL}/api/products/${productId}/compare?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to compare versions');
    }
    return res.json();
  },

  async getRegression(productId: string, versionAId?: string, versionBId?: string): Promise<ApiRegressionResult> {
    const query = new URLSearchParams();
    if (versionAId) query.set('version_a_id', versionAId);
    if (versionBId) query.set('version_b_id', versionBId);
    const res = await authFetch(`${API_BASE_URL}/api/products/${productId}/regression?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch regression analysis');
    }
    return res.json();
  },

  async simulateRule(productId: string, payload: ApiSimulationRequest): Promise<ApiSimulationResponse> {
    const res = await authFetch(`${API_BASE_URL}/api/products/${productId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to execute simulation');
    }
    return res.json();
  },

  async getRiskMap(productId: string, inspectionId?: string): Promise<ApiRiskMapResponse> {
    const query = new URLSearchParams();
    if (inspectionId) query.set('inspection_id', inspectionId);
    const res = await authFetch(`${API_BASE_URL}/api/products/${productId}/risk-map?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch risk map');
    }
    return res.json();
  },

  // Label Passport
  async getPassport(productId: string): Promise<ApiPassportResponse> {
    const res = await authFetch(`${API_BASE_URL}/api/products/${productId}/passport`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch label passport');
    }
    return res.json();
  },

  // Packaging Studio Methods
  async createPackagingProject(payload: any): Promise<ApiPackagingProject> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create packaging project');
    }
    return res.json();
  },

  async listPackagingProjects(): Promise<ApiPackagingProject[]> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to list packaging projects');
    }
    return res.json();
  },

  async getPackagingProject(id: string): Promise<ApiPackagingProject> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch packaging project');
    }
    return res.json();
  },

  async updatePackagingProject(id: string, payload: any): Promise<ApiPackagingProject> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update packaging project');
    }
    return res.json();
  },

  async generatePackaging(id: string): Promise<ApiPackagingProject> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate packaging artwork');
    }
    return res.json();
  },

  async requestRedesign(id: string, feedback_prompt: string): Promise<ApiPackagingRedesignResponse> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects/${id}/redesign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_prompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to request redesign');
    }
    return res.json();
  },

  async acceptRedesign(id: string): Promise<ApiPackagingProject> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects/${id}/accept-redesign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to accept redesign proposal');
    }
    return res.json();
  },

  getPackagingPdfUrl(id: string): string {
    const token = localStorage.getItem('niyamora_token');
    let url = `${API_BASE_URL}/api/packaging-studio/projects/${id}/export-pdf`;
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }
    return url;
  },

  async downloadPackagingPdf(id: string, customFilename?: string): Promise<void> {
    const res = await authFetch(`${API_BASE_URL}/api/packaging-studio/projects/${id}/export-pdf`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download packaging PDF');
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition') || '';
    let filename = customFilename || 'NIYAMORA_Packaging_Export.pdf';
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  getPackagingPanelImageUrl(projectId: string, panelType: string): string {
    const token = localStorage.getItem('niyamora_token');
    let url = `${API_BASE_URL}/api/packaging-studio/projects/${projectId}/panels/${panelType.toUpperCase()}`;
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }
    return url;
  },

  getFileUrl(path: string): string {
    if (!path) return '';
    const token = localStorage.getItem('niyamora_token');
    let cleanPath = path;
    if (!cleanPath.startsWith('http://') && !cleanPath.startsWith('https://')) {
      if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
      }
      cleanPath = `${API_BASE_URL}${cleanPath}`;
    }
    if (token && !cleanPath.includes('token=')) {
      const sep = cleanPath.includes('?') ? '&' : '?';
      cleanPath = `${cleanPath}${sep}token=${encodeURIComponent(token)}`;
    }
    return cleanPath;
  },
};

