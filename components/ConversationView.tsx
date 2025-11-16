import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: The type `LiveSession` is not exported from "@google/genai". It has been removed from this import.
// The `Blob` type is imported for use in the local `LiveSession` type definition.
import { GoogleGenAI, Modality, type LiveServerMessage, type Blob, type FunctionDeclaration, Type } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';
import { type TranscriptionEntry } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audio';
import { MicIcon, StopIcon, UserIcon, RiaIcon } from './icons';

// FIX: Define the `LiveSession` type locally since it is not exported from the `@google/genai` package.
type LiveSession = {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
};

const endCallFunctionDeclaration: FunctionDeclaration = {
    name: 'end_call',
    description: 'Ends the current conversation with the user when all tasks are complete.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
};

export const ConversationView: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcriptionLog, setTranscriptionLog] = useState<TranscriptionEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState('Click start to begin');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [transcriptionLog]);


  const updateTranscription = (speaker: 'user' | 'ria', text: string, isFinal: boolean) => {
    setTranscriptionLog(prevLog => {
        const lastEntry = prevLog[prevLog.length - 1];
        if (lastEntry && lastEntry.speaker === speaker && !lastEntry.isFinal) {
            const updatedLog = [...prevLog];
            updatedLog[updatedLog.length - 1] = { ...lastEntry, text };
            return updatedLog;
        } else {
            return [...prevLog, { id: Date.now(), speaker, text, isFinal }];
        }
    });
  };

  const finalizeTranscriptionTurn = () => {
    setTranscriptionLog(prevLog => {
        if (currentInputTranscriptionRef.current.trim()) {
            prevLog = [...prevLog, { id: Date.now(), speaker: 'user', text: currentInputTranscriptionRef.current, isFinal: true }];
        }
        if (currentOutputTranscriptionRef.current.trim()) {
            prevLog = [...prevLog, { id: Date.now() + 1, speaker: 'ria', text: currentOutputTranscriptionRef.current, isFinal: true }];
        }
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        // Remove non-final entries
        return prevLog.filter(entry => entry.isFinal);
    });
};

  const stopSession = useCallback(() => {
    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;

    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;

    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;

    for (const source of sourcesRef.current.values()) {
        source.stop();
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setIsSessionActive(false);
    setStatusMessage('Click start to begin');
  }, []);

  const onMessageHandler = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
        updateTranscription('ria', currentOutputTranscriptionRef.current, false);
    } else if (message.serverContent?.inputTranscription) {
        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
        updateTranscription('user', currentInputTranscriptionRef.current, false);
    }

    if (message.toolCall) {
        for (const fc of message.toolCall.functionCalls) {
            if (fc.name === 'end_call') {
                console.log('Model requested to end the call.');
                stopSession();
            }
        }
    }

    if (message.serverContent?.turnComplete) {
        finalizeTranscriptionTurn();
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio) {
        const outputCtx = outputAudioContextRef.current;
        if (!outputCtx) return;

        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
        
        try {
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            
            source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
            });
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
        } catch (error) {
            console.error("Error decoding or playing audio:", error);
        }
    }

    if (message.serverContent?.interrupted) {
        for (const source of sourcesRef.current.values()) {
            source.stop();
            sourcesRef.current.delete(source);
        }
        nextStartTimeRef.current = 0;
    }
  }, [stopSession]);

  const startSession = useCallback(async () => {
    setTranscriptionLog([]);
    setStatusMessage('Initializing...');
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable is not set.");
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        setIsSessionActive(true);
        setStatusMessage('Connecting...');

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setStatusMessage('Listening...');
                    const inputCtx = inputAudioContextRef.current;
                    if (!inputCtx) return;
                    
                    const source = inputCtx.createMediaStreamSource(stream);
                    scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputCtx.destination);
                },
                onmessage: onMessageHandler,
                onerror: (e: ErrorEvent) => {
                    console.error('API Error:', e);
                    setStatusMessage(`Error: ${e.message}`);
                    stopSession();
                },
                onclose: (e: CloseEvent) => {
                    console.log('Session closed.');
                    setStatusMessage('Session closed. Click start to begin again.');
                    stopSession();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                systemInstruction: SYSTEM_INSTRUCTION,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                tools: [{ functionDeclarations: [endCallFunctionDeclaration] }],
            },
        });

    } catch (error) {
        console.error('Failed to start session:', error);
        setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsSessionActive(false);
    }
  }, [onMessageHandler, stopSession]);

  const handleToggleSession = () => {
    if (isSessionActive) {
        stopSession();
    } else {
        startSession();
    }
  };

  const renderTranscriptionEntry = (entry: TranscriptionEntry) => {
    const isUser = entry.speaker === 'user';
    const bgColor = isUser ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700';
    const textColor = isUser ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200';
    const alignment = isUser ? 'justify-end' : 'justify-start';
    const bubbleAlignment = isUser ? 'items-end' : 'items-start';
    const Icon = isUser ? UserIcon : RiaIcon;

    return (
        <div key={entry.id} className={`flex ${alignment} my-2`}>
            <div className={`flex flex-col max-w-lg ${bubbleAlignment}`}>
                <div className="flex items-center space-x-2">
                    {!isUser && <Icon className="w-6 h-6 text-red-500" />}
                    <div className={`${bgColor} ${textColor} rounded-2xl p-3`}>
                        <p className={`text-sm ${entry.isFinal ? '' : 'italic opacity-75'}`}>{entry.text || '...'}</p>
                    </div>
                    {isUser && <Icon className="w-6 h-6 text-blue-500" />}
                </div>
            </div>
        </div>
    );
};


  return (
    <div>
      <div ref={logContainerRef} className="h-96 overflow-y-auto p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {transcriptionLog.length === 0 ? (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 dark:text-gray-500">Conversation will appear here...</p>
            </div>
        ) : (
            transcriptionLog.map(renderTranscriptionEntry)
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <button
          onClick={handleToggleSession}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 ${isSessionActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300' : 'bg-green-600 hover:bg-green-700 focus:ring-green-300'}`}
          aria-label={isSessionActive ? "Stop session" : "Start session"}
        >
          {isSessionActive ? <StopIcon className="w-10 h-10" /> : <MicIcon className="w-10 h-10" />}
        </button>
        <p className={`mt-3 text-sm font-medium ${isSessionActive ? 'text-green-600 dark:text-green-400 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
          {statusMessage}
        </p>
      </div>
    </div>
  );
};
