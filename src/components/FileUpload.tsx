import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload = ({ onFileUpload, isLoading }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          setUploadedFile(file);
          onFileUpload(file);
        }
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setUploadedFile(files[0]);
        onFileUpload(files[0]);
      }
    },
    [onFileUpload]
  );

  const clearFile = () => {
    setUploadedFile(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card/80"
          }
        `}
      >
        <div className="p-12 text-center">
          <AnimatePresence mode="wait">
            {uploadedFile ? (
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-foreground">
                    <FileSpreadsheet size={20} className="text-primary" />
                    <span className="font-medium">{uploadedFile.name}</span>
                    <button
                      onClick={clearFile}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                >
                  <Upload size={36} />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    Drop your CSV file here
                  </h3>
                  <p className="text-muted-foreground">
                    or click to browse from your computer
                  </p>
                </div>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <FileSpreadsheet size={18} className="mr-2" />
                      Select CSV File
                    </span>
                  </Button>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated border glow */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: "inset 0 0 30px hsl(var(--primary) / 0.2)",
            }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default FileUpload;
