import { useState, useCallback, useEffect } from 'react';
import { ApiService } from '@/lib/api-service';
import { ScrapeRequest, ScrapeResponse, ImageData } from '@/lib/api-config';

export const useScraper = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [taskStatus, setTaskStatus] = useState<ScrapeResponse | null>(null);
    const [images, setImages] = useState<ImageData[]>([]);

    const startScraping = useCallback(async (request: ScrapeRequest) => {
        try {
            setIsLoading(true);
            setError(null);
            setImages([]);
            setTaskId(null);
            setTaskStatus(null);
            
            const response = await ApiService.startScraping(request);
            setTaskId(response.task_id);
            setTaskStatus(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start scraping');
            setIsLoading(false);
        }
    }, []);

    const checkTaskStatus = useCallback(async () => {
        if (!taskId) return;

        try {
            const status = await ApiService.getTaskStatus(taskId);
            setTaskStatus(status);

            if (status.status === 'completed') {
                // Fetch images when task is completed
                const fetchedImages = await ApiService.getImages({ 
                    page: 1, 
                    limit: 1000,
                    category: taskStatus?.message?.split("'")[1], // Extract category from message
                    sort_by: "scraped_at",
                    sort_order: "desc" // Use string value instead of number
                });
                setImages(fetchedImages);
                setIsLoading(false);
            } else if (status.status === 'failed') {
                setError(status.message);
                setIsLoading(false);
            }

            return status;
        } catch (err) {
            // If task not found (404), reset the state
            if (err instanceof Error && err.message.includes('404')) {
                setTaskId(null);
                setTaskStatus(null);
                setIsLoading(false);
                return null;
            }
            setError(err instanceof Error ? err.message : 'Failed to check task status');
            return null;
        }
    }, [taskId, taskStatus]);

    // Poll for task status when taskId is set
    useEffect(() => {
        if (!taskId) return;

        const pollInterval = setInterval(async () => {
            const status = await checkTaskStatus();
            if (!status || status.status === 'completed' || status.status === 'failed') {
                clearInterval(pollInterval);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [taskId, checkTaskStatus]);

    return {
        isLoading,
        error,
        taskId,
        taskStatus,
        images,
        startScraping,
        checkTaskStatus,
    };
}; 