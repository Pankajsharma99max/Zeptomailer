import { useState } from 'react';

const COMMON_FIELDS = ['name', 'email', 'date', 'company', 'title', 'id', 'score'];

export default function PlaceholderManager({ placeholders, onPlaceholdersChange, csvHeaders = [] }) {
  const [newField, setNewField] = useState('name');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    if (newField && !placeholders.some(p => p.field === newField)) {
      onPlaceholdersChange([
        ...placeholders,
        {
          field: newField,
          x_percent: 50,
          y_percent: 50 + (placeholders.length * 10),
          font_size: 48,
          font_color: '#000000',
          text_align: 'center',
          is_bold: false,
          font_family: 'Roboto',
          text_effect: 'none',
        }
      ]);
      setNewField('name');
      setShowAddForm(false);
    }
  };

  const handleRemove = (field) => {
    onPlaceholdersChange(placeholders.filter(p => p.field !== field));
  };

  const handleUpdate = (field, key, value) => {
    onPlaceholdersChange(
      placeholders.map(p => p.field === field ? { ...p, [key]: value } : p)
    );
  };

  const availableFields = [
    ...COMMON_FIELDS,
    ...csvHeaders.filter(h => !COMMON_FIELDS.includes(h.toLowerCase()))
  ].filter(f => !placeholders.some(p => p.field === f));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content-primary">Placeholders</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs px-2.5 py-1 bg-brand-600 text-white rounded hover:bg-brand-500 transition-colors"
        >
          + Add Field
        </button>
      </div>

      {showAddForm && (
        <div className="flex gap-2 bg-surface-hover p-3 rounded-lg">
          <select
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            className="input-field flex-1 text-sm"
          >
            <option value="">Select field...</option>
            {availableFields.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-500 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      <div className="space-y-2">
        {placeholders.length === 0 ? (
          <p className="text-xs text-content-muted text-center py-3">No placeholders yet. Click "Add Field" to start.</p>
        ) : (
          placeholders.map((ph) => (
            <div key={ph.field} className="flex items-center justify-between p-2.5 bg-surface-hover rounded-lg border border-line">
              <div>
                <p className="text-sm font-medium text-content-primary">{{'{{'}{ph.field}{'}}'}}}</p>
                <p className="text-xs text-content-muted">
                  Pos: {ph.x_percent.toFixed(0)}%, {ph.y_percent.toFixed(0)}% | Size: {ph.font_size}px
                </p>
              </div>
              <button
                onClick={() => handleRemove(ph.field)}
                className="p-1 text-content-muted hover:text-red-500 transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
