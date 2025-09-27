import { GoogleGenAI, Modality } from "@google/genai";

// === State Management ===
const sceneOutputs = new Map();

// === DOM Element Selection ===

// FIX: Cast HTMLElements to more specific types to access properties like 'value', 'disabled', 'files', etc.
// API Key
const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;

// Tabs
const imageTab = document.getElementById('image-tab') as HTMLElement;
const videoTab = document.getElementById('video-tab') as HTMLElement;
const audioTab = document.getElementById('audio-tab') as HTMLElement;
const imageGenerator = document.getElementById('image-generator') as HTMLElement;
const videoGenerator = document.getElementById('video-generator') as HTMLElement;
const audioGenerator = document.getElementById('audio-generator') as HTMLElement;

// Image Generator
const imageScenesContainer = document.getElementById('image-scenes-container') as HTMLElement;
const addImageSceneBtn = document.getElementById('add-image-scene-btn') as HTMLButtonElement;
const imageInitialInput = document.getElementById('image-initial-input') as HTMLInputElement;
const aspectRatio = document.getElementById('aspect-ratio') as HTMLSelectElement;

// Video Generator
const videoScenesContainer = document.getElementById('video-scenes-container') as HTMLElement;
const addVideoSceneBtn = document.getElementById('add-video-scene-btn') as HTMLButtonElement;
const videoInitialInput = document.getElementById('video-initial-input') as HTMLInputElement;
const videoDuration = document.getElementById('video-duration') as HTMLInputElement;

// Audio Generator
const audioPrompt = document.getElementById('audio-prompt') as HTMLTextAreaElement;
const audioPlayBtn = document.getElementById('audio-play-btn') as HTMLButtonElement;
const audioPauseBtn = document.getElementById('audio-pause-btn') as HTMLButtonElement;
const audioStopBtn = document.getElementById('audio-stop-btn') as HTMLButtonElement;
const audioStatus = document.getElementById('audio-status') as HTMLElement;

// Presets
const presetNameInput = document.getElementById('preset-name') as HTMLInputElement;
const savePresetBtn = document.getElementById('save-preset-btn') as HTMLButtonElement;
const presetsList = document.getElementById('presets-list') as HTMLSelectElement;
const loadPresetBtn = document.getElementById('load-preset-btn') as HTMLButtonElement;
const deletePresetBtn = document.getElementById('delete-preset-btn') as HTMLButtonElement;
const PRESETS_STORAGE_KEY = 'ai-media-generator-presets-v2';

// === API Key & UI State ===

function getAiClient() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert("Silakan masukkan Gemini API Key Anda.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

function setAppInteractive(isInteractive) {
    const interactiveElements = document.querySelectorAll('button, input, textarea, select');
    interactiveElements.forEach(el => {
        if (el.id !== 'api-key-input') {
            // FIX: Cast element to access 'disabled' property.
            (el as HTMLInputElement).disabled = !isInteractive;
        }
    });
}

apiKeyInput.addEventListener('input', () => {
    setAppInteractive(apiKeyInput.value.trim().length > 0);
});


// === Tab Switching ===
imageTab.addEventListener('click', () => switchTab('image'));
videoTab.addEventListener('click', () => switchTab('video'));
audioTab.addEventListener('click', () => switchTab('audio'));

function switchTab(tabName) {
    imageTab.classList.toggle('active', tabName === 'image');
    videoTab.classList.toggle('active', tabName === 'video');
    audioTab.classList.toggle('active', tabName === 'audio');

    imageGenerator.classList.toggle('active', tabName === 'image');
    videoGenerator.classList.toggle('active', tabName === 'video');
    audioGenerator.classList.toggle('active', tabName === 'audio');
    
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

// === Utility Functions ===
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // FIX: Ensure reader.result is a string before calling split.
            if (typeof reader.result === 'string') {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            } else {
                reject(new Error('FileReader result is not a string'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function displayError(container, message) {
    if (message.includes('API key not valid')) {
        message = 'Kunci API Anda tidak valid. Silakan periksa kunci Anda dan coba lagi.';
    }
    container.innerHTML = `<p class="error-message">${message}</p>`;
}

function setUiLoading(isLoading) {
    const allButtons = document.querySelectorAll('button');
    const allInputs = document.querySelectorAll('input, textarea, select');
    
    // FIX: Cast NodeList items to elements with a 'disabled' property.
    allButtons.forEach(btn => btn.disabled = isLoading);
    allInputs.forEach(input => (input as HTMLInputElement).disabled = isLoading);

    // Re-enable API key input if UI is loading
    if(isLoading) {
        apiKeyInput.disabled = false;
    } else {
        setAppInteractive(apiKeyInput.value.trim().length > 0);
    }
}


// === Text-to-Speech (TTS) & Audio Generation ===
let utterance = null;
let isPaused = false;

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const localUtterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(localUtterance);
    } else {
        alert("Maaf, browser Anda tidak mendukung text-to-speech.");
    }
}

function updateAudioStatus(status) {
    audioStatus.textContent = `Status: ${status}`;
    audioPlayBtn.disabled = status === 'Playing...';
    audioPauseBtn.disabled = status !== 'Playing...' && status !== 'Paused';
    audioStopBtn.disabled = status === 'Idle';
}

audioPlayBtn.addEventListener('click', () => {
    const text = audioPrompt.value.trim();
    if (!text) {
        alert("Silakan masukkan teks untuk diputar.");
        return;
    }

    if (isPaused && utterance) {
        window.speechSynthesis.resume();
    } else {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => {
            isPaused = false;
            updateAudioStatus('Playing...');
        };
        utterance.onpause = () => {
            isPaused = true;
            updateAudioStatus('Paused');
        };
        utterance.onresume = () => {
            isPaused = false;
            updateAudioStatus('Playing...');
        };
        utterance.onend = () => {
            utterance = null;
            isPaused = false;
            updateAudioStatus('Idle');
        };
        window.speechSynthesis.speak(utterance);
    }
});

audioPauseBtn.addEventListener('click', () => {
    if (window.speechSynthesis.speaking && !isPaused) {
        window.speechSynthesis.pause();
    }
});

audioStopBtn.addEventListener('click', () => {
    if (window.speechSynthesis.speaking || isPaused) {
        window.speechSynthesis.cancel();
    }
});


// === Speech Recognition (Voice Input) ===
// FIX: Cast window to 'any' to access vendor-prefixed SpeechRecognition API.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition;

function setupSpeechRecognition() {
    if (!SpeechRecognition) {
        console.warn("Speech Recognition API tidak didukung di browser ini.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Kesalahan pengenalan ucapan:', event.error);
          alert(`Kesalahan saat pengenalan ucapan: ${event.error}`);
        }
    };
}

function addMicListener(micBtn, textarea) {
    if (!SpeechRecognition) {
        micBtn.style.display = 'none';
        return;
    }
    
    let isRecording = false;

    micBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
            return;
        }
        try {
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                textarea.value += (textarea.value.trim() ? ' ' : '') + transcript;
            };
            
            recognition.onend = () => {
                 isRecording = false;
                 micBtn.classList.remove('recording');
                 micBtn.innerHTML = '🎤';
            };

            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.innerHTML = '🛑';
            recognition.start();
        } catch (e) {
            console.error("Tidak dapat memulai pengenalan", e);
            isRecording = false;
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '🎤';
        }
    });
}

// === Scene Management ===

function createScene(type, container) {
    const sceneCount = container.children.length;
    const sceneCard = document.createElement('div');
    sceneCard.className = 'scene-card';
    sceneCard.dataset.sceneId = `${type}-${Date.now()}`;

    const header = document.createElement('div');
    header.className = 'scene-header';

    const promptContainer = document.createElement('div');
    promptContainer.className = 'prompt-container';

    const textarea = document.createElement('textarea');
    textarea.rows = 2;
    textarea.placeholder = `Prompt Adegan ${sceneCount + 1}...`;
    
    const micBtn = document.createElement('button');
    micBtn.className = 'mic-button';
    micBtn.innerHTML = '🎤';
    micBtn.setAttribute('aria-label', 'Gunakan mikrofon untuk prompt');
    addMicListener(micBtn, textarea);

    promptContainer.appendChild(textarea);
    promptContainer.appendChild(micBtn);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-scene-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.setAttribute('aria-label', 'Hapus adegan');
    
    header.appendChild(promptContainer);
    header.appendChild(removeBtn);

    const generateBtn = document.createElement('button');
    generateBtn.className = 'generate-scene-btn';
    generateBtn.textContent = `Hasilkan ${type === 'image' ? 'Gambar' : 'Video'}`;

    const outputDiv = document.createElement('div');
    outputDiv.className = 'scene-output';

    sceneCard.appendChild(header);
    sceneCard.appendChild(generateBtn);
    sceneCard.appendChild(outputDiv);

    container.appendChild(sceneCard);
}

addImageSceneBtn.addEventListener('click', () => createScene('image', imageScenesContainer));
addVideoSceneBtn.addEventListener('click', () => createScene('video', videoScenesContainer));

// === Generic Scene-Based Generation Logic ===

async function handleSceneGeneration(event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('remove-scene-btn')) {
        const sceneCard = target.closest('.scene-card') as HTMLElement;
        if (sceneCard) {
            const container = sceneCard.parentElement;
            if (container.children.length > 1) {
                sceneOutputs.delete(sceneCard);
                sceneCard.remove();
            }
        }
    }

    if (target.classList.contains('generate-scene-btn')) {
        const sceneCard = target.closest('.scene-card') as HTMLElement;
        if (sceneCard) {
            const type = sceneCard.parentElement.id.includes('image') ? 'image' : 'video';

            if (type === 'image') {
                await generateImageForScene(sceneCard);
            } else {
                await generateVideoForScene(sceneCard);
            }
        }
    }
}

imageScenesContainer.addEventListener('click', handleSceneGeneration);
videoScenesContainer.addEventListener('click', handleSceneGeneration);


// === Image Generation (Per-Scene) ===

async function generateImageForScene(sceneCard) {
    const prompt = (sceneCard.querySelector('textarea') as HTMLTextAreaElement).value.trim();
    const outputDiv = sceneCard.querySelector('.scene-output') as HTMLDivElement;

    if (!prompt) {
        displayError(outputDiv, "Silakan masukkan prompt.");
        return;
    }

    const ai = getAiClient();
    if (!ai) return;

    setUiLoading(true);
    outputDiv.innerHTML = `<div class="loader" aria-hidden="false"></div>`;

    try {
        const prevScene = sceneCard.previousElementSibling;
        let referenceFile;
        let referenceDataUrl;

        if (prevScene && sceneOutputs.has(prevScene) && sceneOutputs.get(prevScene).dataUrl) {
            referenceDataUrl = sceneOutputs.get(prevScene).dataUrl;
        } else if (!prevScene) {
            referenceFile = imageInitialInput.files?.[0];
        }

        let imageUrl;
        let mimeType = 'image/jpeg';

        if (referenceDataUrl || referenceFile) {
            const base64Data = referenceFile ? await blobToBase64(referenceFile) : referenceDataUrl.split(',')[1];
            mimeType = referenceFile ? referenceFile.type : referenceDataUrl.match(/:(.*?);/)[1];
            
            const imagePart = { inlineData: { mimeType, data: base64Data } };
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            
            const imagePartOutput = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (!imagePartOutput || !imagePartOutput.inlineData) {
                 throw new Error("Model tidak mengembalikan gambar. Mungkin permintaan ditolak.");
            }
            mimeType = imagePartOutput.inlineData.mimeType;
            imageUrl = `data:${mimeType};base64,${imagePartOutput.inlineData.data}`;
        } else {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio.value as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                },
            });
            imageUrl = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        }

        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = prompt;

        outputDiv.innerHTML = '';
        outputDiv.appendChild(createImageContainer(imgElement, prompt));
        sceneOutputs.set(sceneCard, { dataUrl: imageUrl });

    } catch (error) {
        console.error("Kesalahan pembuatan gambar:", error);
        displayError(outputDiv, error.message || "Gagal membuat gambar.");
    } finally {
        setUiLoading(false);
    }
}

function createImageContainer(element, promptText) {
    const container = document.createElement('div');
    container.className = 'media-container';
    
    const ttsButton = document.createElement('button');
    ttsButton.className = 'tts-button';
    ttsButton.innerHTML = '🔊';
    ttsButton.setAttribute('aria-label', 'Baca prompt dengan keras');
    ttsButton.addEventListener('click', () => speakText(promptText));

    const filterSelect = document.createElement('select');
    filterSelect.className = 'filter-select';
    const filters = { 'No Filter': '', 'Grayscale': 'filter-grayscale', 'Sepia': 'filter-sepia', 'Invert': 'filter-invert', 'Blur (4px)': 'filter-blur', 'Brightness (150%)': 'filter-brightness', 'Contrast (200%)': 'filter-contrast' };

    for (const [name, className] of Object.entries(filters)) {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = name;
        filterSelect.appendChild(option);
    }

    filterSelect.addEventListener('change', () => {
        for (const className of Object.values(filters)) {
            if (className) element.classList.remove(className);
        }
        if (filterSelect.value) {
            element.classList.add(filterSelect.value);
        }
    });

    container.appendChild(element);
    container.appendChild(ttsButton);
    container.appendChild(filterSelect);
    return container;
}


// === Video Generation (Per-Scene) ===

async function generateVideoForScene(sceneCard) {
    const prompt = (sceneCard.querySelector('textarea') as HTMLTextAreaElement).value.trim();
    const outputDiv = sceneCard.querySelector('.scene-output') as HTMLDivElement;

    if (!prompt) {
        displayError(outputDiv, "Silakan masukkan prompt.");
        return;
    }
    
    const ai = getAiClient();
    if (!ai) return;

    setUiLoading(true);
    const loader = document.createElement('div');
    loader.className = 'loader';
    const statusP = document.createElement('p');
    loader.appendChild(statusP);
    outputDiv.innerHTML = '';
    outputDiv.appendChild(loader);

    try {
        const prevScene = sceneCard.previousElementSibling;
        let image = undefined;

        if (prevScene && sceneOutputs.has(prevScene) && sceneOutputs.get(prevScene).blob) {
            statusP.textContent = `Menangkap frame terakhir dari adegan sebelumnya...`;
            const base64Data = await getLastFrameAsBase64(sceneOutputs.get(prevScene).blob);
            image = { imageBytes: base64Data, mimeType: 'image/jpeg' };
        } else if (!prevScene) {
            const file = videoInitialInput.files?.[0];
            if (file) {
                statusP.textContent = `Memproses gambar awal...`;
                const base64Data = await blobToBase64(file);
                image = { imageBytes: base64Data, mimeType: file.type };
            }
        }
        
        statusP.textContent = `Mengirim permintaan... Ini mungkin memakan waktu beberapa menit.`;
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            image: image,
            config: {
                numberOfVideos: 1,
                durationSeconds: parseInt(videoDuration.value, 10),
            }
        });

        const reassuringMessages = [ "Masih mengerjakan...", "Menyusun adegan digital, harap tunggu...", "Merender frame, tunggu sebentar...", "Hampir selesai...", ];
        for (let j = 0; !operation.done; j++) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            statusP.textContent = reassuringMessages[j % reassuringMessages.length];
            operation = await ai.operations.getVideosOperation({ operation });
        }

        statusP.textContent = `Video dibuat! Mengunduh...`;
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) throw new Error(`Tidak ada tautan unduhan yang ditemukan.`);
        
        const apiKey = apiKeyInput.value.trim();
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) throw new Error(`Gagal mengunduh video: ${videoResponse.statusText}`);
        
        const videoBlob = await videoResponse.blob();
        outputDiv.innerHTML = '';
        outputDiv.appendChild(createVideoContainer(videoBlob, prompt));
        sceneOutputs.set(sceneCard, { blob: videoBlob });

    } catch (error) {
        console.error("Kesalahan pembuatan video:", error);
        displayError(outputDiv, error.message || "Gagal membuat video.");
    } finally {
        setUiLoading(false);
    }
}

function createVideoContainer(videoBlob, prompt) {
    const videoUrl = URL.createObjectURL(videoBlob);
    const mainWrapper = document.createElement('div');
    
    const container = document.createElement('div');
    container.className = 'media-container';
    
    const videoElement = document.createElement('video');
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.src = videoUrl;

    const ttsButton = document.createElement('button');
    ttsButton.className = 'tts-button';
    ttsButton.innerHTML = '🔊';
    ttsButton.setAttribute('aria-label', 'Baca prompt dengan keras');
    ttsButton.addEventListener('click', () => speakText(prompt));
    
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Unduh Video (.mp4)';
    downloadButton.className = 'download-button';
    downloadButton.onclick = () => {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `ai-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const voiceoverButton = document.createElement('button');
    voiceoverButton.textContent = 'Buat Sulih Suara';
    voiceoverButton.className = 'voiceover-button';
    voiceoverButton.onclick = () => {
        switchTab('audio');
        audioPrompt.value = prompt;
        audioPrompt.focus();
    };

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'video-actions';
    actionsContainer.appendChild(downloadButton);
    actionsContainer.appendChild(voiceoverButton);

    container.appendChild(videoElement);
    container.appendChild(ttsButton);
    mainWrapper.appendChild(container);
    mainWrapper.appendChild(actionsContainer);

    return mainWrapper;
}

function getLastFrameAsBase64(videoBlob) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const url = URL.createObjectURL(videoBlob);
        
        video.onloadedmetadata = () => video.currentTime = video.duration;
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Tidak bisa mendapatkan konteks kanvas'));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
            URL.revokeObjectURL(url);
            resolve(base64);
        };
        video.onerror = () => reject(new Error('Gagal memuat video untuk menangkap frame.'));
        video.src = url;
        video.load();
    });
}


// === Preset Management ===
function getPresets() {
    const presetsJson = localStorage.getItem(PRESETS_STORAGE_KEY);
    return presetsJson ? JSON.parse(presetsJson) : {};
}

function savePresets(presets) {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

function populatePresetsDropdown() {
    const presets = getPresets();
    presetsList.innerHTML = '';
    const hasPresets = Object.keys(presets).length > 0;
    if (!hasPresets) {
        const option = document.createElement('option');
        option.textContent = 'Tidak ada preset yang disimpan';
        option.disabled = true;
        presetsList.appendChild(option);
    } else {
        for (const name in presets) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetsList.appendChild(option);
        }
    }
    loadPresetBtn.disabled = !hasPresets;
    deletePresetBtn.disabled = !hasPresets;
}

savePresetBtn.addEventListener('click', () => {
    const name = presetNameInput.value.trim();
    if (!name) {
        alert("Silakan masukkan nama untuk preset.");
        return;
    }
    
    const presets = getPresets();
    presets[name] = { aspectRatio: aspectRatio.value };
    
    savePresets(presets);
    populatePresetsDropdown();
    presetsList.value = name;
    presetNameInput.value = '';
    alert(`Preset "${name}" disimpan!`);
});

loadPresetBtn.addEventListener('click', () => {
    const name = presetsList.value;
    const presets = getPresets();
    if (presets[name]) {
        aspectRatio.value = presets[name].aspectRatio;
    }
});

deletePresetBtn.addEventListener('click', () => {
    const name = presetsList.value;
    if (!name || presetsList.options[presetsList.selectedIndex]?.disabled) return;
    if (confirm(`Apakah Anda yakin ingin menghapus preset "${name}"?`)) {
        const presets = getPresets();
        delete presets[name];
        savePresets(presets);
        populatePresetsDropdown();
        alert(`Preset "${name}" dihapus.`);
    }
});

// === App Initialization ===
function initializeApp() {
    setAppInteractive(false);
    setupSpeechRecognition();
    populatePresetsDropdown();
    updateAudioStatus('Idle');
    createScene('image', imageScenesContainer);
    createScene('video', videoScenesContainer);
}

initializeApp();
