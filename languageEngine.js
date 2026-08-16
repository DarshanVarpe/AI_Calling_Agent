import { GoogleGenerativeAI } from '@google/generative-ai';
import AICallerDatabase from './database.js';
import dotenv from 'dotenv';

dotenv.config();

class LanguageEngine {
    constructor() {
        this.db = new AICallerDatabase();
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Supported languages
        this.supportedLanguages = {
            'en': { name: 'English', voiceId: process.env.ELEVENLABS_VOICE_EN },
            'hi': { name: 'Hindi', voiceId: process.env.ELEVENLABS_VOICE_HI },
            'mr': { name: 'Marathi', voiceId: process.env.ELEVENLABS_VOICE_MR }
        };

        // Initialize pre-translated templates
        this.initializeTemplates();
    }

    async initializeTemplates() {
        const templates = {
            // Introduction templates
            'intro': {
                'en': "Hello! I am Aria, the Aegis Security Copilot. I'm calling to notify you of a critical authentication server outage in the US-East datacenter. Are you currently available to assist with the incident response?",
                'hi': "नमस्कार! मेरा नाम आर्या है, मैं Aegis Security टीम से कॉल कर रही हूँ। मैं आपको यूएस-ईस्ट डेटासेंटर में एक महत्वपूर्ण सर्वर आउटेज के बारे में सूचित करने के लिए कॉल कर रही हूँ। क्या आप अभी घटना प्रतिक्रिया में सहायता के लिए उपलब्ध हैं?",
                'mr': "नमस्कार! माझे नाव आर्या आहे, मी Aegis Security टीमकडून कॉल करत आहे. मी तुम्हाला यूएस-ईस्ट डेटासेंटरमधील एका गंभीर सर्व्हर आउटेजची माहिती देण्यासाठी कॉल करत आहे. तुम्ही सध्या या घटनेच्या प्रतिसादात मदत करण्यासाठी उपलब्ध आहात का?"
            },

            // Incident alert template
            'incident_alert': {
                'en': "Our Lobster Trap DPI is currently enforcing strict network policies. All prompt injections and unauthorized data exfiltration attempts have been blocked. Do I have your authorization to deploy the security patch?",
                'hi': "हमारा लॉबस्टर ट्रैप डीपीआई वर्तमान में सख्त नेटवर्क नीतियां लागू कर रहा है। सभी अनधिकृत डेटा निष्कर्षण प्रयासों को रोक दिया गया है। क्या मेरे पास सुरक्षा पैच तैनात करने के लिए आपका प्राधिकरण है?",
                'mr': "आमचे लॉबस्टर ट्रॅप डीपीआय सध्या कठोर नेटवर्क धोरणे लागू करत आहे. सर्व अनधिकृत डेटा काढण्याचे प्रयत्न थांबवले आहेत. सुरक्षा पॅच तैनात करण्यासाठी माझ्याकडे तुमची अधिकृतता आहे का?"
            },

            // Benefits/Resolution explanation
            'benefits': {
                'en': "The automated patch will isolate the affected edge nodes and rotate the API keys to ensure we remain HIPAA and SOC2 compliant. The downtime will be less than 2 minutes.",
                'hi': "स्वचालित पैच प्रभावित नोड्स को अलग कर देगा और यह सुनिश्चित करने के लिए एपीआई कुंजी घुमाएगा कि हम कंप्लायंट रहें। डाउनटाइम 2 मिनट से कम होगा।",
                'mr': "स्वयंचलित पॅच प्रभावित नोड्स वेगळे करेल आणि आम्ही कंप्लायंट राहू याची खात्री करण्यासाठी एपीआय की फिरवेल. डाउनटाइम 2 मिनिटांपेक्षा कमी असेल."
            },

            // Authorization confirmation
            'rsvp_yes': {
                'en': "Understood. I have your authorization. I am initiating the patch rollout across all US-East edge nodes now and will escalate the post-mortem report to the Level 3 Engineering team. Thank you.",
                'hi': "समझ गई। मेरे पास आपका प्राधिकरण है। मैं अब सभी यूएस-ईस्ट नोड्स पर पैच रोलआउट शुरू कर रही हूँ और पोस्ट-मॉर्टम रिपोर्ट को लेवल 3 इंजीनियरिंग टीम को भेज दूंगी। धन्यवाद।",
                'mr': "समजले. माझ्याकडे तुमची अधिकृतता आहे. मी आता सर्व यूएस-ईस्ट नोड्सवर पॅच रोलआउट सुरू करत आहे आणि पोस्ट-मॉर्टम अहवाल लेव्हल 3 इंजिनिअरिंग टीमला पाठवेन. धन्यवाद."
            },

            // Callback scheduling
            'callback': {
                'en': "I understand you might need to check the logs first. When would be a good time for me to call you back for authorization?",
                'hi': "मैं समझती हूँ कि आपको पहले लॉग चेक करने की आवश्यकता हो सकती है। प्राधिकरण के लिए मैं आपको कब वापस कॉल कर सकती हूँ?",
                'mr': "मला समजते की तुम्हाला आधी लॉग तपासण्याची आवश्यकता असू शकते. अधिकृततेसाठी मी तुम्हाला कधी परत कॉल करू शकते?"
            },

            // Not available/Escalation - polite closure
            'not_interested': {
                'en': "I understand you cannot assist right now. I will escalate this incident to the Level 3 Engineering team immediately. Have a good day.",
                'hi': "मैं समझती हूँ कि आप अभी सहायता नहीं कर सकते। मैं इस घटना को तुरंत लेवल 3 इंजीनियरिंग टीम को भेज दूंगी। आपका दिन शुभ हो।",
                'mr': "मला समजते की तुम्ही आत्ता मदत करू शकत नाही. मी या घटनेला त्वरित लेव्हल 3 इंजिनिअरिंग टीमकडे पाठवेन. तुमचा दिवस शुभ जावो."
            },

            // Questions about timing/details
            'timing_flexible': {
                'en': "The primary database is currently in read-only mode, but we can delay the patch if you need time to review the metrics. The important thing is securing the perimeter.",
                'hi': "प्राथमिक डेटाबेस वर्तमान में रीड-ओनली मोड में है, लेकिन यदि आपको मेट्रिक्स की समीक्षा करने के लिए समय चाहिए तो हम पैच में देरी कर सकते हैं। मुख्य बात सुरक्षा है।",
                'mr': "प्राथमिक डेटाबेस सध्या रीड-ओन्ली मोडमध्ये आहे, परंतु जर तुम्हाला मेट्रिक्सचे पुनरावलोकन करण्यासाठी वेळ हवा असेल तर आम्ही पॅचला विलंब करू शकतो. मुख्य गोष्ट म्हणजे सुरक्षा."
            },

            // Clarification on action
            'free_seminar': {
                'en': "The Lobster Trap system is handling the primary firewall defenses. We just need authorization to proceed with the permanent patch.",
                'hi': "लॉबस्टर ट्रैप सिस्टम प्राथमिक फ़ायरवॉल सुरक्षा को संभाल रहा है। स्थायी पैच के साथ आगे बढ़ने के लिए हमें बस प्राधिकरण की आवश्यकता है।",
                'mr': "लॉबस्टर ट्रॅप सिस्टम प्राथमिक फायरवॉल सुरक्षितता हाताळत आहे. कायमस्वरूपी पॅचसह पुढे जाण्यासाठी आम्हाला फक्त अधिकृतता आवश्यक आहे."
            }
        };

        // Insert templates into database
        for (const [templateKey, languages] of Object.entries(templates)) {
            for (const [langCode, content] of Object.entries(languages)) {
                await this.db.addLanguageTemplate(templateKey, langCode, content);
            }
        }

        console.log('✅ Language templates initialized');
    }

    async detectLanguage(userResponse) {
        try {
            const prompt = `
            Analyze the following text and determine if it's in English, Hindi (हिंदी), or Marathi (मराठी).

            Text: "${userResponse}"

            Respond with EXACTLY one of these codes:
            - "en" for English
            - "hi" for Hindi
            - "mr" for Marathi

            Consider:
            1. Script used (Latin, Devanagari)
            2. Language-specific words and grammar
            3. If mixed languages, choose the dominant one
            4. If unclear or very short, default to "en"

            Response should be ONLY the language code, nothing else.
            `;

            const result = await this.model.generateContent(prompt);
            const detectedLang = result.response.text().trim().toLowerCase();

            // Validate the response
            if (['en', 'hi', 'mr'].includes(detectedLang)) {
                return detectedLang;
            } else {
                console.warn(`Invalid language detection result: ${detectedLang}, defaulting to English`);
                return 'en';
            }
        } catch (error) {
            console.error('Language detection error:', error);
            return 'en'; // Default to English on error
        }
    }

    async getTemplate(templateKey, language) {
        const content = await this.db.getLanguageTemplate(templateKey, language);
        if (!content) {
            // Fallback to English if template not found
            console.warn(`Template '${templateKey}' not found for language '${language}', falling back to English`);
            return await this.db.getLanguageTemplate(templateKey, 'en');
        }
        return content;
    }

    async translateResponse(text, targetLanguage) {
        // For dynamic responses that aren't pre-translated
        if (targetLanguage === 'en') {
            return text; // Already in English
        }

        try {
            const targetLangName = this.supportedLanguages[targetLanguage]?.name || 'Hindi';
            const prompt = `
            Translate the following English text to ${targetLangName}, maintaining the conversational tone and context of a friendly AI assistant calling an on-call engineer about a critical security incident.

            English text: "${text}"

            Important guidelines:
            1. Keep the tone calm and professional
            2. Use appropriate technical and respectful language
            3. Maintain the meaning and intent exactly
            4. Use natural, conversational ${targetLangName}
            5. Don't add or remove any information

            Respond with ONLY the translated text, no explanations or additional content.
            `;

            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original English text on error
        }
    }

    getVoiceId(language) {
        return this.supportedLanguages[language]?.voiceId || this.supportedLanguages['en'].voiceId;
    }

    async analyzeResponseIntent(userResponse, currentLanguage) {
        try {
            const prompt = `
            Analyze this engineer's response to determine their intent regarding a critical security patch deployment authorization.

            Engineer response: "${userResponse}"
            Language: ${this.supportedLanguages[currentLanguage]?.name}

            Classify the intent as EXACTLY one of:
            - "interested" - Shows engagement, asks technical questions about the incident
            - "not_interested" - Clearly declines, says they cannot help, or not their responsibility
            - "callback" - Wants more time to check logs, asks to call later, busy right now
            - "questions" - Has questions about the patch, downtime, or impact
            - "positive_engagement" - Engaging positively but hasn't authorized yet
            - "unclear" - Response is unclear, off-topic, or doesn't clearly indicate intent

            Respond with ONLY the intent category, nothing else.
            `;

            const result = await this.model.generateContent(prompt);
            const intent = result.response.text().trim().toLowerCase();

            if (['interested', 'not_interested', 'callback', 'questions', 'positive_engagement', 'unclear'].includes(intent)) {
                return intent;
            } else {
                return 'unclear';
            }
        } catch (error) {
            console.error('Intent analysis error:', error);
            return 'unclear';
        }
    }

    async generateContextualResponse(userInput, detectedIntent, currentLanguage, conversationContext = []) {
        try {
            const languageName = this.supportedLanguages[currentLanguage]?.name || 'English';

            const prompt = `
            Generate a natural response as Aria, an AI assistant calling engineers about a critical security incident.

            Context:
            - Engineer's input: "${userInput}"
            - Detected intent: ${detectedIntent}
            - Response language: ${languageName}
            - Conversation so far: ${conversationContext.length} exchanges

            Guidelines:
            1. Keep response concise (max 50 words)
            2. Be calm and professional
            3. Match the engineer's technical tone
            4. Use natural ${languageName}

            Based on intent:
            - "interested": Confirm their interest and provide incident details
            - "not_interested": Politely close the conversation and mention escalation
            - "callback": Schedule a callback time
            - "questions": Answer their specific question about the incident
            - "positive_engagement": Continue building rapport and request authorization
            - "unclear": Gently clarify the authorization request

            Respond with ONLY the response text, no explanations.
            `;

            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Response generation error:', error);
            // Fallback to pre-translated template
            return await this.getTemplate('intro', currentLanguage);
        }
    }

    // Smart conversation flow management
    async processEngineerResponse(userResponse, currentLanguage = 'en', conversationContext = []) {
        // Detect language if not set or if language seems different
        let detectedLanguage = currentLanguage;
        if (currentLanguage === 'en' || Math.random() < 0.1) { // Periodic re-detection
            detectedLanguage = await this.detectLanguage(userResponse);
        }

        // Analyze intent
        const intent = await this.analyzeResponseIntent(userResponse, detectedLanguage);

        // Generate appropriate response
        let response;
        const templateMappings = {
            'interested': 'incident_alert',
            'not_interested': 'not_interested',
            'callback': 'callback',
            'questions': 'benefits'
        };

        if (templateMappings[intent]) {
            response = await this.getTemplate(templateMappings[intent], detectedLanguage);
        } else {
            response = await this.generateContextualResponse(
                userResponse, intent, detectedLanguage, conversationContext
            );
        }

        return {
            response,
            detectedLanguage,
            intent,
            shouldContinue: !['not_interested', 'rsvp_confirmed'].includes(intent), // Keep rsvp_confirmed for DB compatibility if needed, but in reality we use patch authorization
            voiceId: this.getVoiceId(detectedLanguage),
            characterCount: response.length
        };
    }

    // Backward compatibility for existing code that expects processStudentResponse
    async processStudentResponse(userResponse, currentLanguage = 'en', conversationContext = []) {
        return this.processEngineerResponse(userResponse, currentLanguage, conversationContext);
    }

    // Get character budget allocation per language
    getLanguageCharacterBudget() {
        const allocation = process.env.LANGUAGE_CHAR_ALLOCATION?.split(',').map(Number) || [334, 333, 333];
        return {
            mr: allocation[0] || 334,
            hi: allocation[1] || 333,
            en: allocation[2] || 333
        };
    }

    // Validate if we can use voice for this language today
    async canUseVoiceForLanguage(language, characterCount) {
        const budget = this.getLanguageCharacterBudget();
        const todaysBatch = await this.db.getTodaysBatch();

        if (!todaysBatch) return true; // No batch today, allow voice

        const usageKey = `character_usage_${language}`;
        const usedToday = todaysBatch[usageKey] || 0;
        const availableBudget = budget[language] || 333;

        return (usedToday + characterCount) <= availableBudget;
    }

    async close() {
        this.db.close();
    }
}

export default LanguageEngine;