import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { api, type ApiProduct, type ApiInspection } from '../services/api';
import type { Product, PackagingType } from '../types';
import pouch3D from '../assets/pouch_3d.jpg';
import {
  PlusCircle,
  ArrowRight,
  Clock,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Loader2,
  Package,
  Sliders,
  Boxes,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Search,
} from 'lucide-react';

// shadcn UI Components
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [inspections, setInspections] = useState<ApiInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('products');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [apiProds, apiInsps] = await Promise.all([
          api.getProducts().catch(() => []),
          api.getInspections().catch(() => []),
        ]);

        const mappedProds: Product[] = apiProds.map((p: ApiProduct) => ({
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

        setProducts(mappedProds);
        setInspections(apiInsps);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to backend service.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalInspections = inspections.length;
  const completedInspections = inspections.filter((i) => i.status === 'COMPLETED').length;
  const issueCount = inspections.reduce((acc, i) => acc + (i.findings_summary?.issue_count || 0), 0);
  const reviewCount = inspections.reduce((acc, i) => acc + (i.findings_summary?.review_count || 0), 0);

  const getGreeting = () => {
    if (!user) return 'Welcome to NIYAMURA';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${timeGreeting}, ${user.name.split(' ')[0]}`;
  };

  const isNewWorkspace = !loading && products.length === 0 && totalInspections === 0;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Header Banner */}
        <div
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--card-bg)] p-8 shadow-sm"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '2rem',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Badge variant="neutral">
                {user?.company || 'Packaging Workspace'}
              </Badge>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              {isNewWorkspace ? 'Welcome to NIYAMURA' : getGreeting()}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '560px', marginBottom: '1.5rem' }}>
              {isNewWorkspace
                ? 'Start your first packaging compliance check to begin building your workspace.'
                : `Screen packaging artwork against Legal Metrology PCR 2011 and FSSAI 2020 rules before plate making. Currently monitoring ${products.length} registered products across ${totalInspections} audits.`}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/create-packaging')}
                className="btn btn-primary btn-lg"
                style={{ gap: '0.5rem', backgroundColor: '#7C3AED' }}
              >
                <Sparkles size={18} />
                <span>Create Packaging</span>
              </button>

              <button
                onClick={() => navigate('/new-check')}
                className="btn btn-secondary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <PlusCircle size={18} />
                <span>Start a Check</span>
              </button>

              <button
                onClick={() => navigate('/simulator')}
                className="btn btn-secondary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <Sliders size={18} />
                <span>Rule Simulator</span>
              </button>
            </div>
          </div>

          {/* Right: 3D Artwork Hero Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                height: '180px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-default)',
              }}
            >
              <img src={pouch3D} alt="Packaging Artwork Inspection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.85) 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '1rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>Pre-Print Compliance Screening</span>
                  <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.75)' }}>Legal Metrology & FSSAI Declarations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-issue-bg)', borderLeft: '4px solid var(--status-issue-solid)', color: 'var(--status-issue-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </div>
        )}

        {/* KPI Summary Cards (shadcn Style) */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Workspace Overview</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Key statutory findings, review items, and verified audit counts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1: Registered Products */}
            <Card className="cursor-pointer" onClick={() => navigate('/products')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Products
                </CardTitle>
                <Boxes className="h-4 w-4 text-[var(--brand-primary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {loading ? '...' : products.length}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Registered SKUs in workspace</span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 2: Completed Audits */}
            <Card className="cursor-pointer border-l-4 border-l-emerald-500" onClick={() => navigate('/products')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Completed Audits
                </CardTitle>
                <FileCheck className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {loading ? '...' : completedInspections}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Determined compliant</span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 3: Statutory Issues */}
            <Card className="cursor-pointer border-l-4 border-l-red-500" onClick={() => navigate('/workbench')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Statutory Issues
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                  {loading ? '...' : issueCount}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                  <span>Non-compliant parameters</span>
                </div>
              </CardContent>
            </Card>

            {/* Metric 4: Review Queue */}
            <Card className="cursor-pointer border-l-4 border-l-amber-500" onClick={() => navigate('/review')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Review Queue
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {loading ? '...' : reviewCount}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                  <span>Flagged for verification</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabbed Workspace Table View (shadcn Style) */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <TabsList>
                <TabsTrigger value="products">Registered Products ({products.length})</TabsTrigger>
                <TabsTrigger value="inspections">Inspection History ({inspections.length})</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search SKU or Brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 text-xs w-64"
                  />
                </div>
                {products.length > 0 && (
                  <Link to="/products" className="btn btn-secondary btn-sm gap-1">
                    <span>View All</span>
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>

            {/* Tab 1: Products Table */}
            <TabsContent value="products">
              {loading ? (
                <Card className="p-12 text-center text-[var(--text-secondary)]">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3 text-[var(--brand-primary)]" />
                  <p className="font-semibold">Loading registered packaging products...</p>
                </Card>
              ) : filteredProducts.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package size={44} className="mx-auto mb-4 text-[var(--brand-primary)] opacity-80" />
                  <h3 className="text-lg font-bold mb-1">No matching packaging products found</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Start a new check to add artwork and SKUs to your catalog.
                  </p>
                  <button onClick={() => navigate('/new-check')} className="btn btn-primary btn-sm gap-1 mx-auto">
                    <PlusCircle size={16} />
                    <span>Start a Check</span>
                  </button>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name & SKU</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Net Quantity</TableHead>
                      <TableHead>Latest Version</TableHead>
                      <TableHead>Compliance Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-bold text-[var(--text-primary)]">{p.name}</div>
                          <div className="text-xs font-mono text-[var(--text-muted)]">SKU: {p.sku}</div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{p.brand}</TableCell>
                        <TableCell className="text-xs text-[var(--text-secondary)]">{p.type}</TableCell>
                        <TableCell className="text-xs font-mono">{p.netQuantity}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">{p.latestVersion}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">PCR 2011 GOOD</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => navigate(`/workbench?productId=${p.id}`)}
                            className="btn btn-ghost btn-sm text-[var(--brand-primary)] gap-1"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={14} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Tab 2: Inspection History */}
            <TabsContent value="inspections">
              {loading ? (
                <Card className="p-12 text-center text-[var(--text-secondary)]">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3 text-[var(--brand-primary)]" />
                  <p className="font-semibold">Loading inspection audits...</p>
                </Card>
              ) : inspections.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileCheck size={44} className="mx-auto mb-4 text-[var(--brand-primary)] opacity-80" />
                  <h3 className="text-lg font-bold mb-1">No inspection history recorded yet</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Upload an artwork file to run your first automated statutory compliance check.
                  </p>
                  <button onClick={() => navigate('/new-check')} className="btn btn-primary btn-sm gap-1 mx-auto">
                    <PlusCircle size={16} />
                    <span>Start a Check</span>
                  </button>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inspection ID</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Issues Found</TableHead>
                      <TableHead>Reviews Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((insp) => (
                      <TableRow key={insp.id}>
                        <TableCell className="font-mono text-xs font-bold text-[var(--brand-primary)]">
                          {insp.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-semibold text-xs">{insp.product_name}</TableCell>
                        <TableCell>
                          <Badge variant={insp.findings_summary?.issue_count ? 'destructive' : 'neutral'}>
                            {insp.findings_summary?.issue_count || 0} Issues
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={insp.findings_summary?.review_count ? 'warning' : 'neutral'}>
                            {insp.findings_summary?.review_count || 0} Review
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={insp.status === 'COMPLETED' ? 'success' : 'secondary'}>
                            {insp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => navigate(`/workbench?inspectionId=${insp.id}`)}
                            className="btn btn-secondary btn-sm gap-1"
                          >
                            <span>Open Workbench</span>
                            <ChevronRight size={14} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </AppShell>
  );
};

export default DashboardPage;
