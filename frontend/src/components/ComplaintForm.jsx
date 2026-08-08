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

export default function ComplaintForm({ onSuccess, onNotify, onError }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-US');
  const [supportsSpeech, setSupportsSpeech] = useState(true);
  const [speechMessage, setSpeechMessage] = useState('Press Speak and allow microphone access.');
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportsSpeech(false);
      setSpeechMessage('Voice input is not supported in this browser.');
      return undefined;
    }

    setSupportsSpeech(true);
    setSpeechMessage('Voice input is ready. Press Speak to start.');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = speechLang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('SpeechRecognition started');
      setSpeechMessage('Listening... please speak now.');
    };

    recognition.onaudiostart = () => {
      console.log('SpeechRecognition audio started');
      setSpeechMessage('Microphone is active. Speak now.');
    };

    recognition.onspeechstart = () => {
      console.log('SpeechRecognition speech started');
      setSpeechMessage('Speech detected. Processing...');
    };

    recognition.onresult = (event) => {
      console.log('SpeechRecognition result', event);
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0].transcript)
        .join('');

      setForm((prev) => {
        const currentDesc = prev.description ? prev.description.trim() : '';
        const space = currentDesc ? ' ' : '';
        return {
          ...prev,
          description: currentDesc + space + transcript,
        };
      });
      setErrors((prev) => ({ ...prev, description: undefined }));
      setSpeechMessage('Voice input captured.');
    };

    recognition.onnomatch = () => {
      console.log('SpeechRecognition no match');
      setSpeechMessage('No speech detected. Try again.');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setSpeechMessage(`Voice input error: ${event.error}`);
      onError?.(`Voice input error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('SpeechRecognition ended');
      setIsListening(false);
      setSpeechMessage('Voice input stopped.');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('Failed to stop recognition on cleanup', err);
        }
      }
    };
  }, [onError, speechLang]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang;
    }
  }, [speechLang]);

  async function checkMicrophonePermission() {
    if (!navigator.permissions || !navigator.permissions.query) return null;
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      console.log('Microphone permission state:', status.state);
      return status.state;
    } catch (err) {
      console.warn('Could not query microphone permission:', err);
      return null;
    }
  }

  async function toggleSpeech() {
    if (!recognitionRef.current) {
      setSupportsSpeech(false);
      setSpeechMessage('Voice input is not supported in this browser.');
      onError?.('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setSpeechMessage('Voice input stopped.');
      onNotify?.('Voice input stopped.');
      return;
    }

    const permissionState = await checkMicrophonePermission();
    if (permissionState === 'denied') {
      setSpeechMessage('Microphone access is denied. Please allow microphone access in your browser settings.');
      onError?.('Microphone access is denied. Please allow microphone access in your browser settings.');
      return;
    }

    try {
      recognitionRef.current.lang = speechLang;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.start();
      setIsListening(true);
      setSpeechMessage(`Listening in ${speechLang === 'en-US' ? 'English' : 'Hindi'}...`);
      onNotify?.(`Listening in ${speechLang === 'en-US' ? 'English' : 'Hindi'}...`);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      const message = err?.message || 'Could not start microphone. Please check permissions.';
      setSpeechMessage(message);
      onError?.(`Could not start microphone. ${message}`);
    }
  }

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#5C6478]">Voice Input:</span>
              <button
                type="button"
                onClick={() => setSpeechLang(speechLang === 'en-US' ? 'hi-IN' : 'en-US')}
                disabled={!supportsSpeech}
                className="rounded bg-[#F7F7F5] border border-[#D8D8D3] px-3 py-2 text-xs font-semibold text-[#1F2430] hover:bg-[#E4E4E0] transition focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {speechLang === 'en-US' ? '🇬🇧 English' : '🇮🇳 Hindi'}
              </button>
              <button
                type="button"
                onClick={toggleSpeech}
                disabled={!supportsSpeech}
                className={`flex min-h-[44px] items-center space-x-1 rounded-lg px-3 py-2 text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]/20 ${
                  !supportsSpeech
                    ? 'bg-[#F7F7F5] text-[#9CA3AF] border-[#D1D5DB] cursor-not-allowed'
                    : isListening
                      ? 'bg-[#D9473D]/10 text-[#D9473D] border-[#D9473D] animate-pulse'
                      : 'bg-[#2F6F5E]/10 text-[#2F6F5E] border-[#2F6F5E]/20 hover:bg-[#2F6F5E]/20'
                }`}
              >
                <span>🎙️</span>
                <span>{isListening ? 'Stop' : supportsSpeech ? 'Speak' : 'Unavailable'}</span>
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#5C6478]">{speechMessage}</p>
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
