import { useState, useCallback, useEffect } from 'react';
import { ApiService } from '@/lib/api-service';
import { ImageData } from '@/lib/api-config';

interface UseImagesOptions {
    initialPage?: number;
    initialLimit?: number;
    initialSearch?: string;
}

export const useImages = (options: UseImagesOptions = {}) => {
    const {
        initialPage = 1,
        initialLimit = 10,
        initialSearch = '',
    } = options;

    const [images, setImages] = useState<ImageData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(initialPage);
    const [limit] = useState(initialLimit);
    const [search, setSearch] = useState(initialSearch);
    const [totalImages, setTotalImages] = useState(0);

    const fetchImages = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await ApiService.getImages({
                page,
                limit,
                search: search || undefined,
            });
            setImages(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch images');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search]);

    const fetchStats = useCallback(async () => {
        try {
            const stats = await ApiService.getStats();
            setTotalImages(stats.total_images);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchImages();
        fetchStats();
    }, [fetchImages, fetchStats]);

    const handleSearch = useCallback((newSearch: string) => {
        setSearch(newSearch);
        setPage(1); // Reset to first page on new search
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    return {
        images,
        isLoading,
        error,
        page,
        limit,
        search,
        totalImages,
        handleSearch,
        handlePageChange,
        refreshImages: fetchImages,
    };
}; 