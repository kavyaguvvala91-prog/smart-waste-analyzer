import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiTrash2, FiImage } from 'react-icons/fi';

export default function UploadCard({ previewUrl, onFileSelect, onRemove, error, isBusy = false, onRequireAuth }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.005 }}
      className="input-panel"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (onRequireAuth && onRequireAuth() === false) return;
        handleFiles(event.dataTransfer.files);
      }}
      >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-[0_8px_18px_rgba(16,185,129,0.08)]">
            <FiUploadCloud />
            Image Upload
          </div>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Drag and drop, browse, or paste your image.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            PNG, JPG, WebP, and GIF files are supported. The preview appears instantly so you can verify the input before analysis.
          </p>
        </div>
        <button
          className="secondary-button shrink-0"
          onClick={() => {
            if (onRequireAuth && onRequireAuth() === false) return;
            inputRef.current?.click();
          }}
          type="button"
        >
          <FiImage />
          Browse
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white p-4">
        {previewUrl ? (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <img src={previewUrl} alt="Waste preview" className="h-64 w-full rounded-2xl object-cover shadow-[0_14px_30px_rgba(16,185,129,0.12)]" />
            <div className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Preview ready</p>
                <p className="mt-2 text-sm text-slate-600">
                  Review the selected image, then run detection to generate the object list and analysis summary.
                </p>
              </div>
              <button type="button" className="secondary-button w-fit" onClick={onRemove} disabled={isBusy}>
                <FiTrash2 />
                Remove image
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (onRequireAuth && onRequireAuth() === false) return;
              handleFiles(event.dataTransfer.files);
            }}
          >
            <FiUploadCloud className="text-4xl text-emerald-600" />
            <p className="mt-4 text-base font-bold text-slate-900">Drop an image here</p>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              No image selected yet. Drag a waste photo into the panel or browse from your device to continue.
            </p>
          </div>
        )}
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
    </motion.div>
  );
}
