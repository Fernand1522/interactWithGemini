// geminiExtension.js

class GeminiExtension {
  constructor(runtime) {
    this.runtime = runtime;
    this.apiKey = 'AIzaSyBfhI3jh9B3f0YdgdtgLsKjvNv9OtR6YNM'; // Will be set by the user
    this.CONCURRENCY_MODE = runtime.constructor.CONCURRENCY_MODE.RESTART; // Or .QUEUE, .FIRST_PROMISE
  }

  getInfo() {
    return {
      id: 'geminiAI',
      name: 'Gemini AI',
      color1: '#4A90E2', // A nice blue color
      color2: '#4285F4',
      color3: '#357ABD',
      blocks: [
        {
          opcode: 'setApiKey',
          blockType: Scratch.BlockType.COMMAND,
          text: 'Set Gemini API Key [KEY]',
          arguments: {
            KEY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'YOUR_API_KEY_HERE' // Remind user to replace this
            }
          },
          func: 'setApiKeyBlock'
        },
        {
          opcode: 'askGemini',
          blockType: Scratch.BlockType.REPORTER,
          text: 'Ask Gemini [PROMPT]',
          arguments: {
            PROMPT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'What is the capital of France?'
            }
          },
          func: 'askGeminiBlock'
        }
      ]
    };
  }

  setApiKeyBlock(args) {
    this.apiKey = args.KEY;
    if (this.apiKey === 'YOUR_API_KEY_HERE' || this.apiKey.trim() === '') {
      console.warn("Gemini AI Extension: API Key not set or is placeholder. Please set a valid API key.");
      // Optionally, provide visual feedback to the user in Scratch, e.g., by setting a variable
    } else {
      console.log("Gemini AI Extension: API Key set.");
    }
  }

  askGeminiBlock(args) {
    const prompt = args.PROMPT;

    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE' || this.apiKey.trim() === '') {
      console.error("Gemini AI Extension: API Key is not set. Use the 'Set Gemini API Key' block.");
      return Promise.resolve("Error: API Key not set.");
    }

    if (!prompt) {
      return Promise.resolve("Error: Prompt is empty.");
    }

    // IMPORTANT: Replace 'gemini-pro' with the specific model you intend to use if different.
    // For the latest models and versions, refer to Google's official documentation.
    // As of early 2024, gemini-1.0-pro was a common model.
    // The generative language API is evolving, ensure you use the correct model name.
    // The new @google/genai SDK often uses models like 'gemini-1.5-flash-latest'.
    // For the REST API, the model name might be `gemini-pro` or `gemini-1.0-pro`.
    // Let's assume 'gemini-pro' for this example with the v1beta REST API.

    const model = 'gemini-pro'; // Or 'gemini-1.0-pro', check Google AI documentation for available models
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
      // You can add generationConfig here if needed, e.g.,
      // generationConfig: {
      //   temperature: 0.7,
      //   maxOutputTokens: 256,
      // }
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          console.error('Gemini API Error:', errorData);
          const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        });
      }
      return response.json();
    })
    .then(data => {
      // Extract the text from the response.
      // The response structure can vary. Consult the Gemini API documentation.
      // Typically, it might be in data.candidates[0].content.parts[0].text
      if (data.candidates && data.candidates.length > 0 &&
          data.candidates[0].content && data.candidates[0].content.parts &&
          data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        // Handle cases where the prompt was blocked
        console.warn('Gemini API: Prompt was blocked. Reason:', data.promptFeedback.blockReason);
        return `Error: Prompt blocked (${data.promptFeedback.blockReason})`;
      } else {
        console.warn('Gemini API: Unexpected response structure', data);
        return 'Error: Could not parse response from Gemini.';
      }
    })
    .catch(error => {
      console.error('Gemini AI Extension Error:', error);
      return `Error: ${error.message}`;
    });
  }
}

// Register the extension
// This part depends on how you are loading the extension into Scratch.
// If using a development environment like scratch-gui, it might auto-register.
// For environments like TurboWarp, you typically use Scratch.extensions.register.

(function() {
  // Check if Scratch and Scratch.extensions are available
  if (typeof Scratch !== 'undefined' && Scratch && Scratch.extensions) {
    Scratch.extensions.register(new GeminiExtension(Scratch.runtime));
  } else {
    console.error("Scratch or Scratch.extensions is not available. Cannot register GeminiExtension.");
    // Fallback for environments where Scratch might not be immediately available
    // or for manual loading.
    if (typeof globalThis.ScratchExtensions === 'undefined') {
        globalThis.ScratchExtensions = {};
    }
    globalThis.ScratchExtensions.GeminiExtension = GeminiExtension;
  }
})();
