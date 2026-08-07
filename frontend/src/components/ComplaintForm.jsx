import { useEffect, useRef, useState } from 'react';
import { createComplaint, uploadPhoto } from '../api/complaints';
import { CATEGORIES, INITIAL_FORM, validateComplaintForm } from '../utils/validation';

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-[#D9473D]">
      {message}
    </p>
  );
}

export default function ComplaintForm({ onSuccess, onError }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0] || null;
    updateField('photo', file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function clearPhoto() {
    updateField('photo', null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setErrors({});
    clearPhoto();
    setSubmittedTicket(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateComplaintForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      onError?.('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = null;

      if (form.photo) {
        const uploadResult = await uploadPhoto(form.photo);
        photoUrl = uploadResult.data.photoUrl;
      }

      const payload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        ...(photoUrl && { photoUrl }),
      };

      const result = await createComplaint(payload);
      setSubmittedTicket(result.data.ticketId);
      onSuccess?.(`Complaint ${result.data.ticketId} submitted successfully.`);
      setForm(INITIAL_FORM);
      setErrors({});
      clearPhoto();
    } catch (err) {
      onError?.(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedTicket) {
    return (
      <section className="rounded-2xl border border-[#E4E4E0] bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#2F6F5E]">
            Ticket created
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold">{submittedTicket}</h2>
          <p className="mt-3 text-sm text-[#5C6478]">
            Your complaint has been logged. Save this ID to track progress.
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="mt-6 rounded-xl bg-[#2F6F5E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#265949] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F5E] focus-visible:ring-offset-2"
          >
            Submit another complaint
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#E4E4E0] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-8">
        <h2 className="font-heading text-2xl font-semibold">File a complaint</h2>
        <p className="mt-2 text-sm text-[#5C6478]">
          Describe the issue clearly so maintenance can respond faster.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
            placeholder="e.g. Ceiling fan not working"
            className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
          />
          <FieldError id="title-error" message={errors.title} />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'category-error' : undefined}
            className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError id="category-error" message={errors.category} />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
            placeholder="What happened? When did you notice it? Any safety concerns?"
            className="mt-2 w-full resize-y rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
          />
          <FieldError id="description-error" message={errors.description} />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? 'location-error' : undefined}
            placeholder="Block B, Room 204"
            className="mt-2 w-full rounded-xl border border-[#D8D8D3] bg-[#F7F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/20"
          />
          <FieldError id="location-error" message={errors.location} />
        </div>

        <div>
          <label htmlFor="photo" className="block text-sm font-medium">
            Photo <span className="text-[#5C6478]">(optional)</span>
          </label>
          <input
            ref={fileInputRef}
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handlePhotoChange}
            aria-invalid={Boolean(errors.photo)}
            aria-describedby={errors.photo ? 'photo-error' : undefined}
            className="mt-2 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#2F6F5E] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#265949]"
          />
          <FieldError id="photo-error" message={errors.photo} />

          {previewUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[#E4E4E0]">
              <img src={previewUrl} alt="Selected complaint preview" className="max-h-56 w-full object-cover" />
              <div className="flex justify-end bg-[#F7F7F5] px-4 py-2">
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-sm font-medium text-[#D9473D] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9473D]"
                >
                  Remove photo
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#2F6F5E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#265949] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F5E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit complaint'}
        </button>
      </form>
    </section>
  );
}
