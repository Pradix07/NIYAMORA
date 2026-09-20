import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProductCard } from '../components/products/ProductCard';
import { Modal } from '../components/common/Modal';
import type { Product, PackagingType } from '../types';
import { api, type ApiProduct } from '../services/api';
import { Plus, Search, Loader2, Package, AlertCircle } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  // New Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductType, setNewProductType] = useState<PackagingType>('Stand-Up Pouch');
  const [newProductNetQty, setNewProductNetQty] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('FOOD_PROCESSED');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiProds = await api.getProducts(searchQuery, typeFilter);
      const mapped: Product[] = apiProds.map((p: ApiProduct) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        sku: p.sku,
        type: (p.packaging_type as PackagingType) || 'Stand-Up Pouch',
        latestVersion: p.latest_version || 'V01',
        status: 'GOOD',
        issueCount: 0,
        reviewCount: 0,
        goodCount: 0,
        lastChecked: 'Active',
        dimensions: '150mm × 220mm',
        netQuantity: p.net_quantity || '250 g',
        description: p.description || 'Packaging artwork master file.',
      }));
      setProducts(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductSku) {
      setCreateError('Product Name and SKU are mandatory.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await api.createProduct({
        name: newProductName,
        brand: newProductBrand || 'My Brand',
        sku: newProductSku,
        category: newProductCategory,
        packaging_type: newProductType,
        net_quantity: newProductNetQty || '250 g',
        description: newProductDesc || 'Newly created packaging master file.',
      });

      const newProd: Product = {
        id: created.id,
        name: created.name,
        brand: created.brand,
        sku: created.sku,
        type: (created.packaging_type as PackagingType) || 'Stand-Up Pouch',
        latestVersion: created.latest_version || 'V01',
        status: 'GOOD',
        issueCount: 0,
        reviewCount: 0,
        goodCount: 0,
        lastChecked: 'Just now',
        dimensions: '150mm × 220mm',
        netQuantity: created.net_quantity || '250 g',
        description: created.description || 'Newly created packaging master file.',
      };

      setProducts([newProd, ...products]);
      setShowNewProductModal(false);
      navigate(`/products/${newProd.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create product on backend.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <AppShell breadcrumbs={[{ label: 'Products' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Packaging Products</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              Manage packaging SKUs, versioned dielines, statutory compliance audits, and label passports.
            </p>
          </div>

          <button
            onClick={() => setShowNewProductModal(true)}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={16} />
            <span>New Product SKU</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-subtle)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by SKU, Product Name, or Brand..."
              className="input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="ALL">All Packaging Types</option>
              <option value="Stand-Up Pouch">Stand-Up Pouch</option>
              <option value="Folding Carton">Folding Carton</option>
              <option value="Rigid Box">Rigid Box</option>
              <option value="Bottle / Label">Bottle / Label</option>
              <option value="Tin Can">Tin Can</option>
              <option value="Flexible Wrapper">Flexible Wrapper</option>
            </select>

            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '140px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="GOOD">Compliant</option>
              <option value="ISSUE">Has Issues</option>
              <option value="REVIEW">Needs Review</option>
            </select>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        {isLoading ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Loading company products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Package size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No products found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0.25rem auto 1.5rem auto' }}>
              {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No packaging products match your search/filter criteria.'
                : 'No packaging products registered in your workspace yet. Create your first product to get started.'}
            </p>
            <button
              onClick={() => setShowNewProductModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create First Product</span>
            </button>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: '1.25rem' }}>
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

      </div>

      {/* New Product Modal */}
      <Modal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        title="Register New Packaging SKU"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {createError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-issue-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--status-issue-text)', fontSize: '0.85rem' }}>
              {createError}
            </div>
          )}

          <div>
            <label className="label">Product Name *</label>
            <input
              type="text"
              required
              className="input"
              placeholder="e.g. Organic Rolled Oats"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Brand *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Aura Organics"
                value={newProductBrand}
                onChange={(e) => setNewProductBrand(e.target.value)}
              />
            </div>
            <div>
              <label className="label">SKU Code *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. AUR-OAT-500"
                value={newProductSku}
                onChange={(e) => setNewProductSku(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Packaging Form Factor</label>
              <select
                className="select"
                value={newProductType}
                onChange={(e) => setNewProductType(e.target.value as PackagingType)}
              >
                <option value="Stand-Up Pouch">Stand-Up Pouch</option>
                <option value="Folding Carton">Folding Carton</option>
                <option value="Rigid Box">Rigid Box</option>
                <option value="Bottle / Label">Bottle / Label</option>
                <option value="Tin Can">Tin Can</option>
                <option value="Flexible Wrapper">Flexible Wrapper</option>
              </select>
            </div>
            <div>
              <label className="label">Net Quantity Measure</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 500 g, 1 L, 10 units"
                value={newProductNetQty}
                onChange={(e) => setNewProductNetQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Regulatory Commodity Category</label>
            <select
              className="select"
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
            >
              <option value="FOOD_PROCESSED">Food & Beverage (Packaged / FSSAI)</option>
              <option value="COSMETICS">Cosmetics & Personal Care</option>
              <option value="ELECTRONICS">Electronics & Hardware</option>
              <option value="GENERAL_COMMODITY">General Packaged Commodity (Legal Metrology)</option>
            </select>
          </div>

          <div>
            <label className="label">Description / Artwork Notes</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Primary front and back packaging master file."
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowNewProductModal(false)}
              className="btn btn-ghost"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating}
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>{isCreating ? 'Creating...' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
