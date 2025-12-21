import React, { useState } from 'react';
import { FamilyMember, WishlistItem, WishlistType } from '@/types/family';
import { ShoppingBag, Heart, AlertCircle, Plus, Trash2, ExternalLink } from 'lucide-react';

interface WishlistComponentProps {
  items: WishlistItem[];
  members: FamilyMember[];
  currentUser: FamilyMember;
  onAddItem: (item: Omit<WishlistItem, 'id'>) => Promise<void>;
  onRemoveItem: (id: string) => Promise<void>;
}

export const WishlistComponent: React.FC<WishlistComponentProps> = ({ items, members, currentUser, onAddItem, onRemoveItem }) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemType, setNewItemType] = useState<WishlistType>(WishlistType.WANT);
  const [newItemLink, setNewItemLink] = useState('');

  const needs = items.filter(i => i.type === WishlistType.NEED);
  const wants = items.filter(i => i.type === WishlistType.WANT);

  const totalNeeds = needs.reduce((acc, item) => acc + item.cost, 0);
  const totalWants = wants.reduce((acc, item) => acc + item.cost, 0);
  const grandTotal = totalNeeds + totalWants;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || !newItemCost) return;

    await onAddItem({
      title: newItemTitle,
      cost: parseFloat(newItemCost),
      type: newItemType,
      addedBy: currentUser.id,
      groupId: '1', // TODO: Get from current group context
      link: newItemLink || undefined
    });

    setNewItemTitle('');
    setNewItemCost('');
    setNewItemLink('');
    setNewItemType(WishlistType.WANT);
  };

  const renderList = (listItems: WishlistItem[], title: string, icon: React.ReactNode, colorClass: string) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className="text-sm text-slate-500">${listItems.reduce((acc, item) => acc + item.cost, 0).toLocaleString()}</span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {listItems.map(item => {
          const addedBy = members.find(m => m.id === item.addedBy);
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <div className="font-medium text-slate-800 text-sm">{item.title}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>${item.cost.toLocaleString()}</span>
                  {addedBy && (
                    <>
                      <span>•</span>
                      <span>by {addedBy.name}</span>
                    </>
                  )}
                  {item.link && (
                    <>
                      <span>•</span>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <ExternalLink size={10} />
                        Link
                      </a>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                title="Remove item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {listItems.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {title.toLowerCase()} yet</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Family Wishlist</h2>
          <p className="text-slate-500">Track wants and needs for the family.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-800">${grandTotal.toLocaleString()}</div>
          <div className="text-sm text-slate-500">Total wishlist value</div>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-indigo-600" />
          Add Wishlist Item
        </h3>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., New laptop, Family vacation..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Cost</label>
              <input
                type="number"
                step="0.01"
                value={newItemCost}
                onChange={(e) => setNewItemCost(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="299.99"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as WishlistType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={WishlistType.WANT}>Want (Nice to have)</option>
                <option value={WishlistType.NEED}>Need (Essential)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link (Optional)</label>
              <input
                type="url"
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!newItemTitle || !newItemCost}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
            Add to Wishlist
          </button>
        </form>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderList(needs, 'Needs', <AlertCircle className="text-red-500" />, 'text-red-600')}
        {renderList(wants, 'Wants', <Heart className="text-pink-500" />, 'text-pink-600')}
      </div>

      {/* Summary */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Wishlist Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">${totalNeeds.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Needs ({needs.length} items)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-pink-600">${totalWants.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Wants ({wants.length} items)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">${grandTotal.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};
