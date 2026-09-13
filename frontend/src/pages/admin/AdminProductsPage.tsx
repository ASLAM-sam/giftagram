import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';
import { adminProductService, AdminProduct, CreateProductPayload, UpdateProductPayload } from '../../services/adminProductService';
import { AdminProductImagesDrawer } from '../../components/admin/AdminProductImagesDrawer';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

type FilterStatus = 'all' | 'active' | 'inactive';
type FilterCategory = 'all' | 'cakes' | 'bouquets';

export const AdminProductsPage: React.FC = () => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  // Catalog State
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');

  // Status toggle in-flight tracking
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal / Drawer State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Image Management Drawer State
  const [imageManagingProduct, setImageManagingProduct] = useState<AdminProduct | null>(null);
  const [isImageDrawerOpen, setIsImageDrawerOpen] = useState<boolean>(false);

  const handleOpenImageManager = (product: AdminProduct) => {
    setImageManagingProduct(product);
    setIsImageDrawerOpen(true);
  };

  // Form Field State
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'cakes' | 'bouquets'>('cakes');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formWeight, setFormWeight] = useState<string>('');
  const [formFlavorCategory, setFormFlavorCategory] = useState<string>('');
  const [formStemCount, setFormStemCount] = useState<string>('');
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formFeatured, setFormFeatured] = useState<boolean>(false);

  // Fetch products from backend
  const fetchCatalog = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      const data = await adminProductService.getProducts();
      setProducts(data);
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err?.message || 'Unable to load products. Please refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    let isMounted = true;
    adminProductService.getProducts().then((data) => {
      if (isMounted) {
        setProducts(data);
        setIsLoading(false);
      }
    }).catch(async (err: any) => {
      if (isMounted) {
        if (err.message?.includes('expired') || err.message?.includes('sign in')) {
          await logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        setErrorMessage(err?.message || 'Unable to load products. Please refresh.');
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [logout, navigate]);

  // Clear success notification after 5s
  useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  // Filtered & Searched products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Status Filter
      if (statusFilter === 'active' && !product.active) return false;
      if (statusFilter === 'inactive' && product.active) return false;

      // 2. Category Filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

      // 3. Search Term (name, slug, category, description)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSlug = product.slug.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [products, statusFilter, categoryFilter, searchTerm]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('cakes');
    setFormPrice('');
    setFormDescription('');
    setFormWeight('');
    setFormFlavorCategory('');
    setFormStemCount('');
    setFormActive(true);
    setFormFeatured(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormCategory(product.category === 'bouquets' ? 'bouquets' : 'cakes');
    setFormPrice(String(product.price));
    setFormDescription(product.description || '');
    setFormWeight(product.weight || '');
    setFormFlavorCategory(product.flavorCategory || '');
    setFormStemCount(product.stemCount ? String(product.stemCount) : '');
    setFormActive(product.active);
    setFormFeatured(product.featured);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
  };

  // Handle Form Submission (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Client Validations
    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }

    const priceNum = Number(formPrice);
    if (!formPrice || isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please provide a valid positive price in rupees.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Product description is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingProduct) {
        // Update Existing Product
        const payload: UpdateProductPayload = {
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          category: formCategory,
          price: Math.round(priceNum),
          description: formDescription.trim(),
          weight: formWeight.trim() || null,
          flavorCategory: formFlavorCategory.trim() || null,
          stemCount: formStemCount ? Number(formStemCount) : null,
          active: formActive,
          featured: formFeatured,
        };

        const updated = await adminProductService.updateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSuccessBanner(`Successfully updated "${updated.name}".`);
      } else {
        // Create New Product
        const payload: CreateProductPayload = {
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          category: formCategory,
          price: Math.round(priceNum),
          description: formDescription.trim(),
          weight: formWeight.trim() || null,
          flavorCategory: formFlavorCategory.trim() || null,
          stemCount: formStemCount ? Number(formStemCount) : null,
          active: formActive,
          featured: formFeatured,
        };

        const created = await adminProductService.createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        setSuccessBanner(`Successfully created new atelier creation "${created.name}".`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setFormError(err?.message || 'Unable to save product. Please check your entries and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick soft-status toggle
  const handleToggleStatus = async (product: AdminProduct) => {
    const nextActive = !product.active;
    setTogglingId(product.id);
    setErrorMessage(null);

    try {
      const updated = await adminProductService.toggleStatus(product.id, nextActive);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSuccessBanner(
        `Product "${updated.name}" is now ${nextActive ? 'Active on storefront' : 'Deactivated (hidden)'}.`
      );
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err?.message || `Failed to update status for ${product.name}.`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Atelier Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream-300 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 px-3 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Giftagram Catalog
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-espresso-900 font-normal tracking-tight">
            Products
          </h1>
          <p className="text-sm sm:text-base text-espresso-700 mt-1 font-sans">
            Manage the collection available through your Giftagram atelier.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchCatalog(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-espresso-700 hover:text-espresso-900 bg-white hover:bg-cream-100 border border-cream-300 px-3.5 py-2.5 rounded-full shadow-soft transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh product catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 px-5 py-2.5 rounded-full shadow-soft hover:shadow-card transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl bg-emerald-50/90 border border-emerald-200/80 p-4 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-soft"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-4 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-cream-300/90 rounded-2xl p-4 sm:p-5 shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-espresso-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, slug, or details..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 placeholder-espresso-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400 hover:text-espresso-700 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Select */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="w-full py-2.5 px-3 text-xs sm:text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
            >
              <option value="all">All Categories</option>
              <option value="cakes">Cakes Only</option>
              <option value="bouquets">Bouquets Only</option>
            </select>
          </div>

          {/* Status Filter Pill Segment */}
          <div className="md:col-span-3 flex items-center justify-end bg-cream-100/70 p-1 rounded-xl border border-cream-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-espresso-900 shadow-sm'
                  : 'text-espresso-600 hover:text-espresso-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-espresso-600 hover:text-espresso-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white text-rose-800 shadow-sm'
                  : 'text-espresso-600 hover:text-espresso-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Counter & Status Filter Summary */}
        <div className="pt-2 border-t border-cream-200/60 flex flex-wrap items-center justify-between text-xs text-espresso-600 gap-2">
          <div>
            Showing <strong className="text-espresso-900 font-semibold">{filteredProducts.length}</strong> of{' '}
            <span>{products.length} products in catalog</span>
            {searchTerm && (
              <span className="ml-2 text-rose-600">
                (filtered by &ldquo;{searchTerm}&rdquo;)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{products.filter((p) => p.active).length} Active</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cream-400" />
              <span>{products.filter((p) => !p.active).length} Inactive</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Products List / Table View */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-cream-300/80 shadow-soft">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <p className="text-sm text-espresso-700 font-serif">Curating atelier catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white rounded-2xl border border-dashed border-cream-300 shadow-soft p-6">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-espresso-400 mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-espresso-900 font-serif">No products match your criteria</h3>
            <p className="text-xs text-espresso-600 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms, changing the category, or selecting another status filter.
            </p>
          </div>
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full border border-rose-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-cream-300/90 rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/70 text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-espresso-600">
                  <th className="py-3.5 px-4 sm:px-6">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Specification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/70 text-xs sm:text-sm">
                {filteredProducts.map((product) => {
                  const hasImage = Boolean(product.images && product.images.length > 0 && product.images[0]);
                  const thumbnail = hasImage ? product.images[0] : null;
                  const isToggling = togglingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-cream-50/50 transition-colors group"
                    >
                      {/* Product Name & Thumbnail */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          {/* Thumbnail / Placeholder */}
                          <div
                            onClick={() => handleOpenImageManager(product)}
                            className="w-12 h-12 rounded-xl overflow-hidden bg-cream-100 border border-cream-200 shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            title="Manage product photography"
                          >
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-cream-400 flex flex-col items-center justify-center p-1">
                                <ImageIcon className="w-4 h-4 text-cream-400" />
                                <span className="text-[0.55rem] uppercase font-mono text-cream-500">None</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-espresso-900 hover:text-rose-600 transition-colors truncate block">
                                {product.name}
                              </span>
                              {product.featured && (
                                <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-full shrink-0">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                  Featured
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-espresso-500 font-mono block truncate">
                              /{product.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                            product.category === 'cakes'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                              : 'bg-cream-200/80 text-espresso-700 border border-cream-300'
                          }`}
                        >
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-medium text-espresso-900 font-mono">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>

                      {/* Specification (Weight or Stem Count) */}
                      <td className="py-3.5 px-4 text-xs text-espresso-600">
                        {product.weight ? (
                          <span className="inline-block bg-cream-100 px-2 py-0.5 rounded text-espresso-700 border border-cream-200">
                            {product.weight}
                          </span>
                        ) : product.stemCount ? (
                          <span className="inline-block bg-cream-100 px-2 py-0.5 rounded text-espresso-700 border border-cream-200">
                            {product.stemCount} stems
                          </span>
                        ) : (
                          <span className="text-cream-400">—</span>
                        )}
                        {product.flavorCategory && (
                          <span className="ml-1 text-[0.7rem] text-rose-600 capitalize">
                            ({product.flavorCategory})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {product.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-espresso-600 bg-cream-100 border border-cream-300/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-cream-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              product.active
                                ? 'text-espresso-600 hover:text-rose-700 bg-cream-50 hover:bg-rose-50 border-cream-200 hover:border-rose-200'
                                : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border-emerald-200'
                            } disabled:opacity-50`}
                            title={product.active ? 'Deactivate product (hide from storefront)' : 'Activate product (show on storefront)'}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : product.active ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Activate</span>
                              </>
                            )}
                          </button>

                          {/* Manage Images Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenImageManager(product)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-espresso-800 hover:text-rose-600 bg-cream-100 hover:bg-cream-200 border border-cream-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Manage product gallery photography"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                            <span className="hidden sm:inline">Images</span>
                            {product.images && product.images.length > 0 && (
                              <span className="text-[0.65rem] font-mono bg-white px-1.5 py-0.2 rounded-full border border-cream-300">
                                {product.images.length}
                              </span>
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-espresso-800 hover:text-rose-600 bg-cream-100 hover:bg-cream-200 border border-cream-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Edit product details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Create / Edit Product Modal Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso-950/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#FFFDF9] border border-cream-300 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-form-title"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-cream-100/70 to-blush-50/70 border-b border-cream-300 px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase font-semibold text-rose-600 block">
                    {editingProduct ? 'Update Product' : 'New Atelier Creation'}
                  </span>
                  <h2 id="product-form-title" className="font-serif text-xl sm:text-2xl text-espresso-900 font-normal">
                    {editingProduct ? editingProduct.name : 'Create Product'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="p-1.5 text-espresso-400 hover:text-espresso-800 rounded-full hover:bg-cream-200/80 transition-colors disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
                {/* Form Error Alert */}
                {formError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3.5 text-rose-800 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Primary Details (Name, Slug) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        // Auto-suggest slug when creating a new product if user hasn't manually edited slug
                        if (!editingProduct && !formSlug) {
                          // let backend slugify handle on save, or provide preview
                        }
                      }}
                      placeholder="e.g. Royal Belgian Truffle"
                      className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                      Slug <span className="text-espresso-400 text-[0.7rem] font-normal">(Auto-generated if blank)</span>
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. royal-belgian-truffle"
                      className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as 'cakes' | 'bouquets')}
                      className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
                    >
                      <option value="cakes">Cakes</option>
                      <option value="bouquets">Bouquets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                      Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-500 font-mono text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="799"
                        className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Specifications: Weight / Stem Count / Flavor Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formCategory === 'cakes' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                          Cake Weight
                        </label>
                        <input
                          type="text"
                          value={formWeight}
                          onChange={(e) => setFormWeight(e.target.value)}
                          placeholder="e.g. 500g, 1 kg"
                          className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                          Flavor Profile
                        </label>
                        <select
                          value={formFlavorCategory}
                          onChange={(e) => setFormFlavorCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
                        >
                          <option value="">None / Unspecified</option>
                          <option value="chocolate">Chocolate</option>
                          <option value="fruit">Fruit & Berries</option>
                          <option value="premium">Premium Gourmet</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                        Stem Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formStemCount}
                        onChange={(e) => setFormStemCount(e.target.value)}
                        placeholder="e.g. 10, 20"
                        className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-espresso-800 uppercase tracking-wider mb-1.5">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the artisanal flavours, floral textures, or confection notes..."
                    className="w-full px-3.5 py-2.5 text-sm bg-cream-50/60 border border-cream-300 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300 transition-all"
                  />
                </div>

                {/* Switches: Active & Featured */}
                <div className="pt-2 border-t border-cream-200/80 flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400/40 border-cream-300"
                    />
                    <span className="text-xs font-medium text-espresso-900">
                      Active on storefront
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400/40 border-cream-300"
                    />
                    <span className="text-xs font-medium text-espresso-900">
                      Featured in atelier collection
                    </span>
                  </label>
                </div>

                {/* Atelier Image Management Section */}
                {editingProduct ? (
                  <div className="p-4 rounded-xl bg-white border border-cream-300 shadow-soft flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-100 border border-cream-200 shrink-0 flex items-center justify-center">
                        {editingProduct.images && editingProduct.images.length > 0 ? (
                          <img
                            src={editingProduct.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-cream-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-espresso-900 block truncate">
                          Atelier Photography Gallery
                        </span>
                        <span className="text-[0.72rem] text-espresso-500 block">
                          {editingProduct.images?.length || 0} photo(s) &bull; Cloudinary CDN
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenImageManager(editingProduct)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Manage Photos</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-cream-100/70 border border-cream-200 text-xs text-espresso-600 flex items-start gap-2.5">
                    <ImageIcon className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <div>
                      <strong className="font-medium text-espresso-900 block">
                        Product Photography
                      </strong>
                      <span>
                        Save this product first to upload studio photography, manage covers, and reorder assets.
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-cream-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-espresso-700 hover:text-espresso-900 bg-cream-100 hover:bg-cream-200 border border-cream-300 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 text-xs sm:text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 rounded-full shadow-soft hover:shadow-card transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Atelier Photography Gallery Drawer */}
      <AdminProductImagesDrawer
        isOpen={isImageDrawerOpen}
        product={imageManagingProduct}
        onClose={() => {
          setIsImageDrawerOpen(false);
          setImageManagingProduct(null);
        }}
        onImagesUpdated={() => {
          fetchCatalog(false);
        }}
      />
    </div>
  );
};
