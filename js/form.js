document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('form[data-endpoint]');
  
    if (!forms.length) return;
  
    forms.forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
  
        const formData = new FormData(form);
        const endpoint = form.getAttribute('data-endpoint');
  
        fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        })
          .then(response => {
            if (response.ok) {
              alert('Thank you! Your submission has been received.');
              form.reset();
              location.reload(); // Optional — remove if not needed
            } else {
              alert('Oops! There was a problem submitting your form.');
            }
          })
          .catch(() => {
            alert('Something went wrong. Please try again later.');
          });
      });
    });
  });