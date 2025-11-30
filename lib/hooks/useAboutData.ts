import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface AboutPageContent {
    title?: string;
    subtitle?: string;
    mission_title?: string;
    mission_text?: string;
    founded_text?: string;
    bento_items?: any[];
    commitments_title?: string;
    commitments?: any[];
    cta_title?: string;
    cta_text?: string;
    cta_btn_primary?: string;
    cta_btn_secondary?: string;
    [key: string]: any;
}

export const useAboutData = () => {
    const [content, setContent] = useState<AboutPageContent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const { data } = await supabase
                    .from('page_content')
                    .select('content')
                    .eq('id', 'about')
                    .single();

                if (data && data.content) {
                    setContent(data.content);
                }
            } catch (err) {
                console.error("Failed to fetch about content:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    return { content, loading };
};
