document.addEventListener('DOMContentLoaded', () => {
    // Prediction form logic
    const form = document.getElementById('predictionForm');
    const resultContainer = document.getElementById('resultContainer');
    const cropNameEl = document.getElementById('cropName');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceValue = document.getElementById('confidenceValue');
    const resetButton = document.getElementById('resetButton');

    // Chatbot logic
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatTyping = document.getElementById('chatTyping');
    const chatMic = document.getElementById('chatMic');
    const chatMute = document.getElementById('chatMute');
    const chatLanguage = document.getElementById('chatLanguage');
    
    let chatHistory = [];
    let isMuted = false;
    
    if (chatMute) {
        chatMute.addEventListener('click', () => {
            isMuted = !isMuted;
            chatMute.textContent = isMuted ? '🔇' : '🔊';
            if (isMuted) window.speechSynthesis.cancel();
        });
    }
    
    // Web Speech API Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            if(chatMic) chatMic.classList.add('recording');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isRecording = false;
            if(chatMic) chatMic.classList.remove('recording');
        };

        recognition.onend = () => {
            isRecording = false;
            if(chatMic) chatMic.classList.remove('recording');
        };
    } else {
        if(chatMic) chatMic.style.display = 'none';
    }

    if (chatMic) {
        chatMic.addEventListener('click', () => {
            if (!recognition) {
                alert("Voice recognition is not supported in this browser.");
                return;
            }
            if (isRecording) {
                recognition.stop();
            } else {
                let langCode = 'en-US';
                const lang = chatLanguage.value;
                if (lang === 'Hindi') langCode = 'hi-IN';
                else if (lang === 'Telugu') langCode = 'te-IN';
                else if (lang === 'Tamil') langCode = 'ta-IN';
                else if (lang === 'Marathi') langCode = 'mr-IN';
                else if (lang === 'Kannada') langCode = 'kn-IN';
                
                recognition.lang = langCode;
                recognition.start();
            }
        });
    }

    // Text to Speech
    let currentAudio = null;
    async function speakText(text) {
        if (isMuted) return;
        
        // Stop any currently playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // Remove markdown and emojis
        const cleanText = text.replace(/[\*\#\_]/g, '').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        
        try {
            const response = await fetch('/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: cleanText, 
                    language: chatLanguage ? chatLanguage.value : 'English' 
                })
            });
            
            if (!response.ok) throw new Error('TTS API failed');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            currentAudio = new Audio(url);
            
            // Clean up blob URL after playing
            currentAudio.onended = () => URL.revokeObjectURL(url);
            
            currentAudio.play();
        } catch (error) {
            console.error('TTS error:', error);
        }
    }

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

            // Update Explainable AI & Fertilizer Sections
            const aiInsightSection = document.getElementById('aiInsightSection');
            const aiExplanationText = document.getElementById('aiExplanationText');
            const fertilizerText = document.getElementById('fertilizerText');

            if (result.explanation && result.fertilizer) {
                aiExplanationText.textContent = result.explanation;
                fertilizerText.textContent = result.fertilizer;
                aiInsightSection.classList.remove('hidden');
            } else {
                aiInsightSection.classList.add('hidden');
            }

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

    // Chatbot functionality
    chatToggle.addEventListener('click', () => {
        chatContainer.classList.toggle('hidden');
    });

    chatClose.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
    });

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
        
        let formattedMessage = message;
        if (!isUser) {
            // Apply very basic formatting for the new structured response
            formattedMessage = formattedMessage
                .replace(/\*([^\*]+)\*/g, "<strong>$1</strong>") // Convert *bold* to <strong>
                .replace(/\n(.*)/g, "<br>$1"); // Convert new lines to <br>
        }
        
        messageDiv.innerHTML = `<div class="message-bubble">${formattedMessage}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping(show = true) {
        chatTyping.classList.toggle('hidden', !show);
        if (show) chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        chatInput.value = '';
        showTyping(true);
        chatSend.disabled = true;
        
        chatHistory.push({ role: 'user', content: message });
        if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10); // keep last 10 turns

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message,
                    language: chatLanguage ? chatLanguage.value : 'English',
                    history: chatHistory.slice(0, -1)
                })
            });

            if (!response.ok) throw new Error('Chat API error');

            const data = await response.json();
            showTyping(false);
            addMessage(data.response || 'No response received');
            
            if (data.response) {
                chatHistory.push({ role: 'model', content: data.response });
                speakText(data.response);
            }
        } catch (error) {
            console.error('Chat error:', error);
            showTyping(false);
            addMessage('Sorry, unable to connect to AgriBot. Check console.');
        } finally {
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    chatSend.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Focus input when opened
    chatToggle.addEventListener('click', () => {
        setTimeout(() => chatInput.focus(), 300);
    });
});
