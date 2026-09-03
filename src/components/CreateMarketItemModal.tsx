import React, { useState, useRef } from 'react';
import { 
  X, Upload, Loader2, Tag, MapPin, 
  DollarSign, Package, Phone, Image as ImageIcon,
  CheckCircle2, Box
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { compressImageFile } from '../services/storageService';
import type { ProcessedImage } from '../services/storageService';

interface CreateMarketItemModalProps {
  onClose: () => void;
  onItemCreated: () => void;
  currentUser: any;
}

const MARKET_CATEGORIES = [
  { id: 'drones', label: 'დრონები' },
  { id: 'parts', label: 'ნაწილები' },
  { id: 'goggles', label: 'სათვალეები' },
  { id: 'radios', label: 'მართვა (Remote)' },
  { id: 'batteries', label: 'ელემენტები' },
  { id: 'other', label: 'სხვა' },
];

const CONDITIONS = [
  { id: 'new', label: 'ახალი' },
  { id: 'used', label: 'მეორადი' },
  { id: 'damaged', label: 'დაზიანებული' },
];

const CreateMarketItemModal: React.FC<CreateMarketItemModalProps> = ({ onClose, onItemCreated, currentUser }) => {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(MARKET_CATEGORIES[0].id);
  const [condition, setCondition] = useState(CONDITIONS[1].id); // Default: Used
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<ProcessedImage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const processed = await compressImageFile(file);
      setImageFile(processed);
      setImagePreview(URL.createObjectURL(processed.file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !description || !imageFile || !phone) return;

    setLoading(true);
    try {
      // ვაგზავნით ყველა ახალ ველს
      await apiService.addMarketItem({
        title,
        price: parseFloat(price),
        subCategory: category, // ვინახავთ როგორც subCategory
        condition,
        brand,
        location,
        phone,
        content: description,
        image: imageFile,
        author: currentUser
      });
      
      onItemCreated();
      onClose();
    } catch (error) {
      console.error("Error creating market item:", error);
      alert("შეცდომა განცხადების დამატებისას");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Package className="text-emerald-500" />
            <h2 className="text-lg font-black uppercase tracking-wide text-white">განცხადების დამატება</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. IMAGE UPLOAD (Big Area) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-48 w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group ${
                imagePreview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-emerald-500/30 hover:bg-white/5'
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-2xl p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                     <Upload size={24} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">დაამატე სურათი</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* 2. BASIC INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Title */}
               <div className="md:col-span-2 space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">სათაური</label>
                 <input 
                   required 
                   type="text" 
                   value={title} 
                   onChange={(e) => setTitle(e.target.value)} 
                   placeholder="მაგ: iFlight Nazgul 5 V3" 
                   className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none" 
                 />
               </div>

               {/* Price */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ფასი (GEL)</label>
                 <div className="relative">
                   <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                   <input 
                     required 
                     type="number" 
                     value={price} 
                     onChange={(e) => setPrice(e.target.value)} 
                     placeholder="0.00" 
                     className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-emerald-500 outline-none font-mono" 
                   />
                 </div>
               </div>

               {/* Category */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">კატეგორია</label>
                 <div className="relative">
                   <select 
                     value={category} 
                     onChange={(e) => setCategory(e.target.value)}
                     className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                   >
                     {MARKET_CATEGORIES.map(cat => (
                       <option key={cat.id} value={cat.id}>{cat.label}</option>
                     ))}
                   </select>
                   <Tag size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 </div>
               </div>
            </div>

            {/* 3. DETAILS GRID (Brand, Location, Condition) */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">დეტალები</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ბრენდი / მოდელი</label>
                    <div className="relative">
                      <Box size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={brand} 
                        onChange={(e) => setBrand(e.target.value)} 
                        placeholder="მაგ: DJI, TBS..." 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ლოკაცია</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        placeholder="ქალაქი / უბანი" 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 outline-none" 
                      />
                    </div>
                  </div>
               </div>

               {/* Condition Selector */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">მდგომარეობა</label>
                 <div className="grid grid-cols-3 gap-2">
                    {CONDITIONS.map(cond => (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setCondition(cond.id)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          condition === cond.id 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                            : 'bg-slate-950 border-white/10 text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                 </div>
               </div>
            </div>

            {/* 4. CONTACT & DESCRIPTION */}
            <div className="space-y-4">
               {/* Phone */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">საკონტაქტო ნომერი</label>
                 <div className="relative">
                   <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     required 
                     type="tel" 
                     value={phone} 
                     onChange={(e) => setPhone(e.target.value)} 
                     placeholder="5XX XX XX XX" 
                     className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-emerald-500 outline-none font-mono" 
                   />
                 </div>
               </div>

               {/* Description */}
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">აღწერა</label>
                 <textarea 
                   required 
                   value={description} 
                   onChange={(e) => setDescription(e.target.value)} 
                   placeholder="აღწერეთ ნივთი დეტალურად..." 
                   className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 outline-none resize-none" 
                 />
               </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                <span>{loading ? 'ქვეყნდება...' : 'განცხადების დამატება'}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMarketItemModal;