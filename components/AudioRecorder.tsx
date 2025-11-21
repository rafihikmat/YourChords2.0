
import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Wand2 } from 'lucide-react';
import { ai } from '../lib/gemini';
import { Modality } from '@google/genai';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const base64Audio = await blobToBase64(audioBlob);
      
      // Use gemini-2.5-flash for audio transcription as requested
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { 
                    inlineData: { 
                        mimeType: 'audio/webm', 
                        data: base64Audio 
                    } 
                },
                { text: "Transcribe the lyrics from this audio accurately. Return only the lyrics." }
            ]
        }
      });

      if (response.text) {
        onTranscriptionComplete(response.text);
      }
    } catch (error) {
      console.error("Transcription failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the Data URL prefix (e.g., "data:audio/webm;base64,")
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={isProcessing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
             <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
             <Mic className="w-3 h-3" />
          )}
          {isProcessing ? 'Processing Audio...' : 'Record Lyrics'}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-xs font-medium animate-pulse transition-colors"
        >
          <Square className="w-3 h-3 fill-current" />
          Stop Recording
        </button>
      )}
    </div>
  );
};

export default AudioRecorder;
