import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Check, Save } from 'lucide-react';
import { Category, CategoryID, CategoryGroup } from '../types';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: CategoryID) => void;
  onAddSubCategory: (categoryId: CategoryID, label: string) => void;
  onDeleteSubCategory: (categoryId: CategoryID, subCategoryId: string) => void;
  onUpdateSubCategory: (categoryId: CategoryID, subCategoryId: string, newLabel: string) => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory, onAddSubCategory, onDeleteSubCategory, onUpdateSubCategory
}) => {
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Hash');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<CategoryGroup>('community');
  
  const [newSubCatLabel, setNewSubCatLabel] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Editing SubCategory State
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const handleAddCategory = () => {
    if (!newCatLabel || !newCatId) return;
    
    const newCategory: Category = {
      id: newCatId.toLowerCase().replace(/\s+/g, '-'),
      name: newCatLabel,
      icon: newCatIcon,
      description: '',
      group: newCatGroup,
      slug: newCatSlug || newCatId.toLowerCase(),
      subCategories: [],
      label: newCatLabel
    };

    onAddCategory(newCategory);
    setNewCatLabel('');
    setNewCatId('');
    setNewCatSlug('');
  };

  const handleAddSubCategory = () => {
    if (!selectedCatId || !newSubCatLabel) return;
    onAddSubCategory(selectedCatId, newSubCatLabel);
    setNewSubCatLabel('');
  };

  const startEditingSub = (catId: string, sub: any) => {
    // sub შეიძლება იყოს string ან ობიექტი
    const subId = typeof sub === 'string' ? sub : sub.id;
    const subLabel = typeof sub === 'string' ? sub : sub.label;
    
    setEditingSubId(subId);
    setEditLabel(subLabel);
  };

  const saveEditingSub = (catId: string, subId: string) => {
    if (!editLabel.trim()) return;
    onUpdateSubCategory(catId, subId, editLabel);
    setEditingSubId(null);
    setEditLabel('');
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(c => c.id === selectedCatId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="text-indigo-500" />
                კატეგორიების მართვა
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* LEFT: Categories List & Add */}
              <div className="w-1/3 border-r border-white/5 flex flex-col bg-slate-950/30">
                <div className="p-4 border-b border-white/5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase">ახალი კატეგორია</h3>
                  <input 
                    type="text" 
                    placeholder="ID (მაგ: fpv-racing)" 
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <input 
                    type="text" 
                    placeholder="სახელი (მაგ: FPV Racing)" 
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <select 
                    value={newCatGroup}
                    onChange={(e) => setNewCatGroup(e.target.value as CategoryGroup)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300"
                  >
                    <option value="community">Community</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="resources">Resources</option>
                    <option value="official">Official</option>
                  </select>
                  <button 
                    onClick={handleAddCategory}
                    disabled={!newCatId || !newCatLabel}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus size={16} /> დამატება
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {categories.map(cat => (
                    <div 
                      key={cat.id} 
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`p-3 rounded-xl cursor-pointer flex justify-between items-center group transition-all ${
                        selectedCatId === cat.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div>
                        <div className={`font-bold text-sm ${selectedCatId === cat.id ? 'text-indigo-400' : 'text-white'}`}>
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{cat.id}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }} 
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Subcategories */}
              <div className="flex-1 flex flex-col bg-slate-900">
                {selectedCatId ? (
                  <>
                    <div className="p-6 border-b border-white/5">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{selectedCategory?.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                            {selectedCategory?.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="ახალი ქვეკატეგორია..." 
                          value={newSubCatLabel}
                          onChange={(e) => setNewSubCatLabel(e.target.value)}
                          className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory()}
                        />
                        <button 
                          onClick={handleAddSubCategory}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl flex items-center justify-center"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">
                        ქვეკატეგორიები ({selectedCategory?.subCategories?.length || 0})
                      </h4>
                      
                      {selectedCategory?.subCategories?.map((sub: any) => {
                        // Handle both string and object structure
                        const subId = typeof sub === 'string' ? sub : sub.id;
                        const subLabel = typeof sub === 'string' ? sub : sub.label;
                        const isEditing = editingSubId === subId;

                        return (
                          <div key={subId} className="flex items-center gap-3 p-3 bg-slate-950/50 border border-white/5 rounded-xl group hover:border-indigo-500/30 transition-colors">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                             
                             {isEditing ? (
                               <div className="flex-1 flex items-center gap-2">
                                 <input 
                                   autoFocus
                                   type="text" 
                                   value={editLabel}
                                   onChange={(e) => setEditLabel(e.target.value)}
                                   className="flex-1 bg-slate-900 border border-indigo-500/50 rounded px-2 py-1 text-sm text-white outline-none"
                                   onKeyDown={(e) => e.key === 'Enter' && saveEditingSub(selectedCatId, subId)}
                                 />
                                 <button onClick={() => saveEditingSub(selectedCatId, subId)} className="text-emerald-400 hover:bg-emerald-400/10 p-1 rounded">
                                   <Check size={14} />
                                 </button>
                               </div>
                             ) : (
                               <div className="flex-1 flex justify-between items-center">
                                 <span className="text-sm text-slate-300 font-medium">{subLabel}</span>
                                 <span className="text-xs text-slate-400 font-mono">#{subId}</span>
                               </div>
                             )}

                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {!isEditing && (
                                 <button onClick={() => startEditingSub(selectedCatId, sub)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded">
                                   <Edit2 className="w-3.5 h-3.5" />
                                 </button>
                               )}
                               <button onClick={() => onDeleteSubCategory(selectedCatId, subId)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                          </div>
                        );
                      })}
                      {(!selectedCategory?.subCategories?.length) && (
                        <div className="text-center py-8 text-slate-400 text-sm italic">ქვეკატეგორიები არ არის</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                    <Edit2 size={48} className="mb-4 opacity-20" />
                    აირჩიეთ კატეგორია დეტალების სანახავად
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManageCategoriesModal;