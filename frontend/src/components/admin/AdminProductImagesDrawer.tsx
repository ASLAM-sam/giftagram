import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Trash2,
  RefreshCw,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { adminImageService, ProductImageItem } from '../../services/adminImageService';
import { AdminProduct } from '../../services/adminProductService';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminProductImagesDrawerProps {
  isOpen: boolean;
  product: AdminProduct | null;
  onClose: () => void;
  onImagesUpdated?: () => void;
}

export const AdminProductImagesDrawer: React.FC<AdminProductImagesDrawerProps> = ({
  isOpen,
  product,
  onClose,
  onImagesUpdated,
}) => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [altTextInput, setAltTextInput] = useState<string>('');
  const [makePrimaryInput, setMakePrimaryInput] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingTargetId, setReplacingTargetId] = useState<string | null>(null);

  const loadImages = React.useCallback(async (productId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await adminImageService.getProductImages(productId);
      setImages(data);
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err.message || 'Unable to load product images.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);

  // Fetch product images whenever drawer opens
  useEffect(() => {
    if (isOpen && product) {
      loadImages(product.id);
    }
  }, [isOpen, product, loadImages]);

  // Clear success notification
  useEffect(() => {
    if (!successBanner) return;
    const timer = setTimeout(() => setSuccessBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [successBanner]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      await adminImageService.uploadProductImage(
        product.id,
        file,
        altTextInput.trim() || undefined,
        makePrimaryInput || images.length === 0
      );
      setSuccessBanner('Uploaded successfully to Giftagram Atelier.');
      setAltTextInput('');
      setMakePrimaryInput(false);
      await loadImages(product.id);
      if (onImagesUpdated) onImagesUpdated();
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err.message || 'Unable to upload image right now.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!product) return;
    setActionInProgressId(imageId);
    setErrorMessage(null);

    try {
      await adminImageService.setPrimaryImage(product.id, imageId);
      setSuccessBanner('Atelier primary cover photo updated.');
      await loadImages(product.id);
      if (onImagesUpdated) onImagesUpdated();
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err.message || 'Failed to update primary image.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleTriggerReplace = (imageId: string) => {
    setReplacingTargetId(imageId);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const handleFileReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product || !replacingTargetId) return;

    setActionInProgressId(replacingTargetId);
    setErrorMessage(null);

    try {
      await adminImageService.replaceProductImage(product.id, replacingTargetId, file);
      setSuccessBanner('Image replaced safely in Atelier.');
      await loadImages(product.id);
      if (onImagesUpdated) onImagesUpdated();
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err.message || 'Unable to replace image right now.');
    } finally {
      setActionInProgressId(null);
      setReplacingTargetId(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!product) return;
    setActionInProgressId(imageId);
    setErrorMessage(null);

    try {
      await adminImageService.deleteProductImage(product.id, imageId);
      setSuccessBanner('Image removed from Atelier gallery.');
      setDeletingId(null);
      await loadImages(product.id);
      if (onImagesUpdated) onImagesUpdated();
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('sign in')) {
        await logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      setErrorMessage(err.message || 'This image could not be removed.');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-espresso-950/40 backdrop-blur-sm transition-opacity cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl bg-cream-50 h-full shadow-2xl flex flex-col z-10 border-l border-cream-300"
          >
          {/* Header */}
          <div className="p-6 bg-white border-b border-cream-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-rose-600 block">
                  Atelier Photography
                </span>
                <h2 className="text-lg font-serif font-medium text-espresso-900 truncate max-w-sm">
                  {product.name}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 text-espresso-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden Replace File Input */}
          <input
            type="file"
            ref={replaceInputRef}
            onChange={handleFileReplace}
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
          />

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successBanner && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* Upload Section */}
            <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-espresso-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  Upload New Atelier Asset
                </h3>
                <span className="text-[0.68rem] font-mono text-espresso-400">JPG, PNG, WebP &bull; Max 10MB</span>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Alt text / description (optional)"
                  value={altTextInput}
                  onChange={(e) => setAltTextInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-cream-50/60 border border-cream-200 rounded-xl text-espresso-900 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-300"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-espresso-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={makePrimaryInput}
                      onChange={(e) => setMakePrimaryInput(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-400 border-cream-300"
                    />
                    <span>Set as Primary cover photo</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={isUploading}
                    className="hidden"
                    id="admin-image-upload-input"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-cream-50 text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-rose-300" />
                        <span>Select File to Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-espresso-700">
                  Product Gallery ({images.length})
                </h3>
                <span className="text-[0.7rem] text-espresso-500">
                  {images.filter((i) => i.isPrimary).length} Primary selected
                </span>
              </div>

              {isLoading ? (
                <div className="py-16 text-center space-y-2 bg-white rounded-2xl border border-cream-200">
                  <Loader2 className="w-6 h-6 text-rose-500 animate-spin mx-auto" />
                  <p className="text-xs text-espresso-600 font-serif">Loading atelier assets...</p>
                </div>
              ) : images.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-dashed border-cream-300 p-6">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center text-cream-400 mx-auto">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-espresso-800 font-serif">No images uploaded yet</p>
                    <p className="text-xs text-espresso-500 mt-0.5">
                      Upload your first studio photograph above to display on the storefront.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((image, index) => {
                    const isActing = actionInProgressId === image.id;
                    const isDeletingConfirm = deletingId === image.id;

                    return (
                      <div
                        key={image.id}
                        className={`group bg-white rounded-2xl border overflow-hidden transition-all shadow-soft flex flex-col ${
                          image.isPrimary
                            ? 'border-rose-300 ring-2 ring-rose-300/30'
                            : 'border-cream-300/80 hover:border-cream-400'
                        }`}
                      >
                        {/* Image Preview */}
                        <div className="relative aspect-square w-full bg-cream-100 overflow-hidden">
                          <img
                            src={image.secureUrl}
                            alt={image.altText || product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />

                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 bg-espresso-950/80 backdrop-blur-sm text-rose-300 text-[0.62rem] tracking-wider uppercase font-semibold px-2.5 py-1 rounded-full border border-rose-300/40">
                              <Star className="w-3 h-3 fill-rose-300 text-rose-300" />
                              Primary Cover
                            </div>
                          )}

                          {/* Order Indicator */}
                          <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-white/90 backdrop-blur-sm text-espresso-800 text-[0.65rem] font-mono flex items-center justify-center border border-cream-300">
                            {index + 1}
                          </div>

                          {/* In-action overlay */}
                          {isActing && (
                            <div className="absolute inset-0 bg-espresso-950/60 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                              <span>Processing...</span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-3 bg-cream-50/50 border-t border-cream-200/80 flex items-center justify-between gap-1.5 text-xs">
                          {/* Set Primary Button */}
                          {!image.isPrimary ? (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(image.id)}
                              disabled={isActing}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.7rem] font-medium text-espresso-700 hover:text-espresso-900 bg-white hover:bg-cream-100 border border-cream-200 transition-colors cursor-pointer disabled:opacity-50"
                              title="Set as product primary cover photo"
                            >
                              <Star className="w-3 h-3 text-cream-400 group-hover:text-amber-500" />
                              <span>Set Primary</span>
                            </button>
                          ) : (
                            <span className="text-[0.7rem] font-medium text-rose-600 px-2">
                              Active Cover
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {/* Replace Button */}
                            <button
                              type="button"
                              onClick={() => handleTriggerReplace(image.id)}
                              disabled={isActing}
                              className="p-1.5 rounded-lg text-espresso-600 hover:text-espresso-900 bg-white hover:bg-cream-100 border border-cream-200 transition-colors cursor-pointer disabled:opacity-50"
                              title="Replace this image with a new file"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            {isDeletingConfirm ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(image.id)}
                                  disabled={isActing}
                                  className="px-2 py-1 rounded text-[0.68rem] bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  className="p-1 rounded text-espresso-500 hover:text-espresso-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingId(image.id)}
                                disabled={isActing}
                                className="p-1.5 rounded-lg text-espresso-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-cream-200 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Delete image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-cream-200 flex items-center justify-between text-xs text-espresso-500 shrink-0">
            <span>Giftagram Media Security: Authenticated Worker Proxy</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
