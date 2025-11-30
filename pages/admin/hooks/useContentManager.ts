import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import { PageContent } from '../../../types';

export const useContentManager = () => {
    const [pages, setPages] = useState<PageContent[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('home');
    const [editContent, setEditContent] = useState<Record<string, any>>({});
    const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();

    const fetchContent = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('page_content').select('*');
        if (error) {
            toastError('Failed to fetch content: ' + error.message);
        } else if (data) {
            setPages(data as PageContent[]);
            const current = data.find(p => p.id === selectedPageId);
            if (current) setEditContent(current.content);
        }
        setLoading(false);
    }, [selectedPageId, toastError]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handlePageSelect = (pageId: string) => {
        setSelectedPageId(pageId);
        const p = pages.find(x => x.id === pageId);
        setEditContent(p ? p.content : {});
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('page_content')
                .upsert({ id: selectedPageId, content: editContent, updated_at: new Date().toISOString() });
            
            if (error) throw error;
            success('Content updated successfully! Changes are live.');
            fetchContent();
        } catch (e: any) {
            toastError('Error saving: ' + (e.message || "Unknown error"));
        }
    };

    const updateField = (key: string, value: any) => {
        setEditContent((prev) => ({ ...prev, [key]: value }));
    };

    const updateNestedField = (parent: string, key: string, value: any) => {
        setEditContent((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [key]: value
            }
        }));
    };

    const removeField = (key: string) => {
        if (!confirm(`Are you sure you want to delete the field "${key}"?`)) return;
        setEditContent(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const addField = (key: string) => {
        if (editContent[key]) {
            toastError('Field already exists!');
            return false;
        }
        setEditContent(prev => ({ ...prev, [key]: '' }));
        success('New field added. You can now edit it.');
        return true;
    };

    return {
        pages,
        selectedPageId,
        editContent,
        viewMode,
        loading,
        setEditContent,
        setViewMode,
        handlePageSelect,
        handleSave,
        updateField,
        updateNestedField,
        removeField,
        addField
    };
};
