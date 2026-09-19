import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProductCard } from '../components/products/ProductCard';
import { Modal } from '../components/common/Modal';
import { SAMPLE_PRODUCTS } from '../data/mockData';
import type { Product, PackagingType } from '../types';
import { api } from '../services/api';
import { Plus, Search, Loader2 } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
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
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    api.getProducts()
      .then((apiProds) => {
        if (apiProds && apiProds.length > 0) {
          const mapped: Product[] = apiProds.map((p) => ({
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
        }
      })
      .catch((err) => {
        console.warn('Backend products endpoint not reachable, displaying local catalog:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductSku) return;

    setIsCreating(true);
    try {
      const created = await api.createProduct({
        name: newProductName,
        brand: newProductBrand || 'My Brand',
        sku: newProductSku,
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
    } catch (err) {
      console.warn('Creating locally due to offline server:', err);
      const fallbackProd: Product = {
        id: 'prod_' + Math.random().toString(36).substr(2, 6),
        name: newProductName,
        brand: newProductBrand || 'My Brand',
        sku: newProductSku,
        type: newProductType,
        latestVersion: 'V01',
        status: 'GOOD',
        issueCount: 0,
        reviewCount: 0,
        goodCount: 0,
        lastChecked: 'Just now',
        dimensions: '150mm × 220mm',
        netQuantity: newProductNetQty || '250 g',
        description: newProductDesc || 'Newly created packaging master file.',
      };
      setProducts([fallbackProd, ...products]);
      setShowNewProductModal(false);
      navigate(`/products/${fallbackProd.id}`);
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Products Catalog</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Central product master registry for packaging artwork versions and compliance history
            </p>
          </div>

          <button
            onClick={() => setShowNewProductModal(true)}
            className="btn btn-primary"
            style={{ gap: '0.4rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
          >
            <Plus size={16} />
            <span>New Product Master</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search product name, SKU, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', height: '38px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ height: '38px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Packaging Types</option>
                <option value="Stand-Up Pouch">Stand-Up Pouch</option>
                <option value="Glass Bottle">Glass Bottle</option>
                <option value="Rigid Carton">Rigid Carton</option>
                <option value="Jar / Tub">Jar / Tub</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '38px', fontSize: '0.8125rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUE">Has Issues</option>
                <option value="REVIEW">Pending Review</option>
                <option value="GOOD">Compliant / Pass</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading product masters from backend...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid-3" style={{ gap: '1.5rem' }}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              No products found matching your search and filter criteria.
            </p>
          </div>
        )}

      </div>

      {/* New Product Modal */}
      <Modal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        title="Create New Product Master"
        subtitle="Establish a packaging product master for version tracking and pre-print screening."
      >
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Product Name *
            </label>
            <input
              type="text"
              required
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="e.g. Organic Almond Butter Jar"
              style={{ width: '100%' }}
            />
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Brand Name
              </label>
              <input
                type="text"
                value={newProductBrand}
                onChange={(e) => setNewProductBrand(e.target.value)}
                placeholder="e.g. Aura Botanicals"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                SKU / Item Code *
              </label>
              <input
                type="text"
                required
                value={newProductSku}
                onChange={(e) => setNewProductSku(e.target.value)}
                placeholder="e.g. AB-ALM-350"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Packaging Format
              </label>
              <select
                value={newProductType}
                onChange={(e) => setNewProductType(e.target.value as PackagingType)}
                style={{ width: '100%' }}
              >
                <option value="Stand-Up Pouch">Stand-Up Pouch</option>
                <option value="Glass Bottle">Glass Bottle</option>
                <option value="Rigid Carton">Rigid Carton</option>
                <option value="Jar / Tub">Jar / Tub</option>
                <option value="Tin Can">Tin Can</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Declared Net Quantity
              </label>
              <input
                type="text"
                value={newProductNetQty}
                onChange={(e) => setNewProductNetQty(e.target.value)}
                placeholder="e.g. 350 g or 500 ml"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Packaging Description & Substrate Notes
            </label>
            <textarea
              rows={3}
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              placeholder="e.g. Matte finish foil pouch with tamper-evident seal and transparent back window..."
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setShowNewProductModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isCreating}>
              {isCreating ? 'Creating Product...' : 'Create Product Master'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
