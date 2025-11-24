
import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SongUploader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        navigate('/auth');
        return;
    }
    if (!file || !title || !artist) {
        setError("All fields are required.");
        return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload File
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('song-files')
        .upload(filePath, file);

      if (uploadError) {
          // Handle case where bucket might not exist yet
          if (uploadError.message.includes("bucket not found")) {
              throw new Error("Storage bucket 'song-files' not configured. Please ask Admin to run SQL setup.");
          }
          throw uploadError;
      }

      // 2. Create Song Record
      const { data: songData, error: dbError } = await supabase
        .from('songs')
        .insert([{
            title,
            artist,
            file_path: filePath,
            difficulty: 'Medium', // Default
            view_count: 0
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
          navigate(`/song/${songData.id}`);
      }, 1500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Upload failed:', err);
        setError(err.message);
      } else {
        setError('Unknown error occurred.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl">
           <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
               <Upload className="w-5 h-5 text-primary" /> Upload Song File
           </h2>
           
           <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Song Title</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="Enter title"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Artist</label>
                    <input 
                        type="text" 
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="Enter artist"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">File (PDF, TXT, Image)</label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".pdf,.txt,.doc,.docx,.jpg,.png"
                            required
                        />
                        {file ? (
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <FileText className="w-5 h-5" />
                                {file.name}
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">Click to browse or drag file here</p>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                {success && (
                     <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4" /> Upload successful! Redirecting...
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Upload to Library'}
                </button>
           </form>
       </div>
    </div>
  );
};

export default SongUploader;
