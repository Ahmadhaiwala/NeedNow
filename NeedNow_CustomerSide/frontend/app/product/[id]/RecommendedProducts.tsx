'use client';

import { useEffect, useState } from 'react';
import { ProductCard, Product } from '@/components/CategorySection';
import { Loader2, Sparkles } from 'lucide-react';

interface RecommendedProductsProps {
  productId: string;
  categoryId?: string;
}

export default function RecommendedProducts({ productId, categoryId }: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      setLoading(true);
      try {
        let res = await fetch(`http://localhost:8000/api/catalog/api/products/${productId}/related/`);
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        } else if (categoryId) {
          // Fallback to category products
          res = await fetch(`http://localhost:8000/api/catalog/products/${categoryId}/`);
          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.results ?? []);
            setProducts(items.filter((p: Product) => p.id !== productId).slice(0, 6));
          }
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRelated();
  }, [productId, categoryId]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] rounded-2xl bg-[var(--surface-1)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-juice)]" />
        Loading recommendations...
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5" style={{ color: 'var(--color-juice)' }} />
        <h2 className="text-2xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
          You Might Also Like
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </div>
  );
}
