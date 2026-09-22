'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Sparkles } from 'lucide-react';

export interface NoteSectionItem {
  heading: string;
  items: string[];
}

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: {
    title: string;
    excerpt: string;
    sections: NoteSectionItem[];
  }) => void;
}

export function NewNoteModal({ isOpen, onClose, onSubmit }: NewNoteModalProps) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [sections, setSections] = useState<NoteSectionItem[]>([
    {
      heading: '1. Overview & Requirements',
      items: [''],
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        heading: `${sections.length + 1}. Section Heading`,
        items: [''],
      },
    ]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, idx) => idx !== sectionIndex));
  };

  const handleSectionHeadingChange = (sectionIndex: number, heading: string) => {
    const updated = [...sections];
    updated[sectionIndex].heading = heading;
    setSections(updated);
  };

  const handleAddItemToSection = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].items.push('');
    setSections(updated);
  };

  const handleRemoveItemFromSection = (sectionIndex: number, itemIndex: number) => {
    const updated = [...sections];
    if (updated[sectionIndex].items.length <= 1) return;
    updated[sectionIndex].items = updated[sectionIndex].items.filter((_, idx) => idx !== itemIndex);
    setSections(updated);
  };

  const handleItemChange = (sectionIndex: number, itemIndex: number, value: string) => {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex] = value;
    setSections(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    // Clean up sections and filter out completely empty bullet items
    const cleanedSections = sections
      .map((sec) => ({
        heading: sec.heading.trim() || 'General Notes',
        items: sec.items.map((it) => it.trim()).filter((it) => it.length > 0),
      }))
      .filter((sec) => sec.items.length > 0 || sec.heading.length > 0);

    // If no bullet items provided at all, create a default one from excerpt or title
    if (cleanedSections.length === 0 || cleanedSections.every((s) => s.items.length === 0)) {
      cleanedSections.push({
        heading: '1. Note Content',
        items: [excerpt.trim() || 'Detailed project note specifications.'],
      });
    }

    const cleanedExcerpt =
      excerpt.trim() ||
      (cleanedSections[0]?.items[0]
        ? cleanedSections[0].items[0].slice(0, 120) + (cleanedSections[0].items[0].length > 120 ? '...' : '')
        : 'Project technical note created.');

    try {
      await onSubmit({
        title: title.trim(),
        excerpt: cleanedExcerpt,
        sections: cleanedSections,
      });

      // Reset state on successful submission
      setTitle('');
      setExcerpt('');
      setSections([
        {
          heading: '1. Overview & Requirements',
          items: [''],
        },
      ]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pb-32 sm:pb-36 pt-4">
      <div className="bg-[#FAF8F5] border-3 border-black rounded-2xl w-full max-w-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col font-sans max-h-[calc(100vh-8rem)]">
        
        {/* Header */}
        <div className="bg-[#FFD93D] border-b-3 border-black p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-black">
              <FileText className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide">Add Project Note</h3>
              <p className="text-[10px] font-bold text-black/70">Create structured specifications &amp; documentation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-white hover:bg-zinc-100 text-black rounded-lg border-2 border-black flex items-center justify-center cursor-pointer shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Note Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-black uppercase tracking-wider flex items-center justify-between">
              <span>Note Title *</span>
              <span className="text-[10px] font-bold text-zinc-400">e.g. Architecture Specification</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Database Migration & Authentication Plan"
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          {/* Short Summary / Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-black uppercase tracking-wider flex items-center justify-between">
              <span>Short Summary / Excerpt</span>
              <span className="text-[10px] font-bold text-zinc-400">Preview displayed in list</span>
            </label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 1-sentence overview of this note..."
              className="w-full bg-white text-black font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-400"
            />
          </div>

          {/* Structured Sections */}
          <div className="space-y-4 pt-2 border-t-2 border-black/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Note Sections &amp; Bullet Points</span>
              </label>
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-[#C4B5FD] hover:bg-[#B7A5F7] text-black font-black text-[11px] px-2.5 py-1 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Add Section</span>
              </button>
            </div>

            {/* Section Blocks */}
            <div className="space-y-4">
              {sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => handleSectionHeadingChange(sIdx, e.target.value)}
                      placeholder={`Section ${sIdx + 1} Heading (e.g. 1. Technical Stack)`}
                      className="flex-1 bg-[#FAF8F5] text-black font-black text-xs px-3 py-1.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sIdx)}
                        className="text-zinc-400 hover:text-[#B91C1C] p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>

                  {/* Bullet Items inside this section */}
                  <div className="space-y-2 pl-2 border-l-2 border-black/20">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-2">
                        <span className="text-zinc-400 font-bold text-xs select-none">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleItemChange(sIdx, iIdx, e.target.value)}
                          placeholder="Detail, specification or action item..."
                          className="flex-1 bg-white text-black font-medium text-xs px-2.5 py-1.5 rounded-lg border border-black/30 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                        {section.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromSection(sIdx, iIdx)}
                            className="text-zinc-400 hover:text-[#B91C1C] p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddItemToSection(sIdx)}
                      className="text-[11px] font-bold text-[#0369A1] hover:underline flex items-center gap-1 cursor-pointer pt-1 pl-3"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Add bullet item</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t-2 border-black/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-zinc-100 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Saving Note...' : 'Save Note'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
