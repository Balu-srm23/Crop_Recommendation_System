document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predictionForm');
    const resultContainer = document.getElementById('resultContainer');
    const cropNameEl = document.getElementById('cropName');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceValue = document.getElementById('confidenceValue');
    const resetButton = document.getElementById('resetButton');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Convert values to numbers
        for (let key in data) {
            data[key] = parseFloat(data[key]);
        }

        try {
            // Show loading state (optional enhancement)
            const submitBtn = form.querySelector('.cta-button');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Analyzing...';
            submitBtn.disabled = true;

            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();

            // Update UI with result
            cropNameEl.textContent = result.prediction;

            // Update confidence meter
            const confidencePercent = (result.confidence * 100).toFixed(1) + '%';
            confidenceBar.style.width = confidencePercent;
            confidenceValue.textContent = confidencePercent;

            // Show result card with animation
            resultContainer.classList.remove('hidden');

            // Scroll to result
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while predicting. Please try again.');
        } finally {
            // Reset button state
            const submitBtn = form.querySelector('.cta-button');
            submitBtn.innerHTML = `Predict Best Crop <span class="arrow">→</span>`;
            submitBtn.disabled = false;
        }
    });

    resetButton.addEventListener('click', () => {
        form.reset();
        resultContainer.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
