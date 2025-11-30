import React from 'react';
import { FieldEditor } from './FieldEditor';

interface HomeEditorProps {
    content: Record<string, any>;
    updateField: (key: string, value: any) => void;
}

export const HomeEditor: React.FC<HomeEditorProps> = ({ content, updateField }) => {
    return (
        <>
            <FieldEditor
                label="Hero Title Prefix"
                value={content.hero_title_prefix}
                onChange={(val) => updateField('hero_title_prefix', val)}
                placeholder="Master your chords in "
            />
            <FieldEditor
                label="Hero Title Words (Comma Separated)"
                value={content.hero_title_words}
                onChange={(val) => updateField('hero_title_words', val)}
                type="array"
                placeholder="Hyperspeed, Realtime, Focus"
                helperText="These words will flip/animate."
            />
            <FieldEditor
                label="Hero Subtitle"
                value={content.hero_subtitle}
                onChange={(val) => updateField('hero_subtitle', val)}
                type="textarea"
            />
        </>
    );
};
