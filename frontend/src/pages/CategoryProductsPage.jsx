import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { productService, categoryService } from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import SkeletonLoader from '../components/SkeletonLoader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getCategoryImage } from '../utils/categoryImages.js';

/**
 * CategoryProductsPage
 * Renders all active products belonging to the category identified by its slug.
 * Route: /category/:slug
 */
export default function CategoryProductsPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const catRes = await categoryService.getByIdOrSlug(slug);
        if (!isMounted) return;
        if (catRes?.data?.success) setCategory(catRes.data.category);

        const params = {
          page: currentPage,
          limit: 12,
          category: catRes?.data?.category?._id || slug,
          sort: searchParams.get('sort') || 'newest',
        };
        const feat = searchParams.get('featured');
        if (feat === 'true') params.featured = 'true';

        const prodRes = await productService.getProducts(params);
        if (!isMounted) return;
        if (prodRes?.data?.success) {
          setProducts(prodRes.data.products || []);
          setTotalPages(prodRes.data.totalPages || 1);
          setCurrentPage(prodRes.data.currentPage || 1);
          setTotalCount(prodRes.data.total || (prodRes.data.products || []).length);
        } else {
          setProducts([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load category products');
          setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentPage, searchParams]);

  const handlePage = (newPage) => {
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryTitle = category?.name || slug?.replace(/-/g, ' ') || 'Category';
  const categoryImage = category?.image?.url || getCategoryImage(category?.slug || slug) || '';

    return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Category Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100 transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        {categoryImage ? (
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
            <img src={categoryImage} alt={categoryTitle} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>{categoryTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {totalCount} {totalCount === 1 ? 'product' : 'products'} found
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <EmptyState
          title="Something went wrong"
          description={error}
          actionText="Try Again"
          actionLink={`/category/${slug}`}
        />
      )}

      {/* Products Grid */}
      {!error && loading ? (
        <SkeletonLoader type="product" count={8} />
      ) : !error && products.length === 0 ? (
        <EmptyState
          title="No products in this category"
          description="We couldn't find any active products here. Try exploring another aisle."
          actionText="Browse All Categories"
          actionLink="/categories"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <button
            type="button"
            onClick={() => handlePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const isCurrent = pageNum === currentPage;
            if (totalPages <= 7 || Math.abs(pageNum - currentPage) <= 2) {
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePage(pageNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            }
            return null;
          })}
          <button
            type="button"
            onClick={() => handlePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer note */}
      {!loading && !error && (
        <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Showing {products.length} of {totalCount} products in {categoryTitle}
        </p>
      )}
    </div>
  );
}
