export const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Mess/Food',
  'Cleanliness',
  'Noise',
  'Other',
];

export const INITIAL_FORM = {
  title: '',
  category: '',
  description: '',
  location: '',
  photo: null,
};

export function validateComplaintForm(form) {
  const errors = {};

  const title = form.title.trim();
  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length > 120) {
    errors.title = 'Title must be 120 characters or fewer';
  }

  if (!form.category) {
    errors.category = 'Please select a category';
  } else if (!CATEGORIES.includes(form.category)) {
    errors.category = 'Invalid category selected';
  }

  const description = form.description.trim();
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer';
  }

  const location = form.location.trim();
  if (!location) {
    errors.location = 'Location is required';
  } else if (location.length > 120) {
    errors.location = 'Location must be 120 characters or fewer';
  }

  if (form.photo) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(form.photo.type)) {
      errors.photo = 'Photo must be JPEG, PNG, WebP, or GIF';
    } else if (form.photo.size > 5 * 1024 * 1024) {
      errors.photo = 'Photo must be under 5 MB';
    }
  }

  return errors;
}
