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

  async getInspection(id: string): Promise<ApiInspection> {
    const res = await fetch(`${API_BASE_URL}/api/inspections/${id}`);
    if (!res.ok) throw new Error('Failed to fetch inspection');
    return res.json();
  },

  getFileUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  },
};
